http = require("http");
fs = require("fs");
url = require("url");
mkdirp = require("mkdirp");


module.exports = {}

function getPageBaseURL(base,uri,callback) {
    return getPage(url.resolve(base,uri),callback)
}
module.exports.getPageBaseURL = getPageBaseURL
function getPage(uri,callback) {
    http.get(uri,(res) => {
        res.setEncoding("utf8");
        let data = '';
        res.on("data",(chunk) => {
            data += chunk;
        });
        res.on("end",()=>{
            callback(data)
        });
    }).on("error",() => {
        console.log("error");
        throw "error";
    })
}
module.exports.getPage = getPage;

var parserClass = class Parser {
    constructor() {
        this.basedir = ""
        this.baseurl = ""
    }
    weekName(week) {
        return week.name+"-"+week.year+".html";
    }

    getYearDir(year) {
        return this.basedir+year+"/weeks/"
    }
    getScoreURL(year) {
        return ""
    }
    
    scoreLocation(year) {
        return this.getYearDir(year) +"score"+"-"+year+".html";
    }
    getSubURL(url,callback) {
        getPageBaseURL(this.baseurl,url,callback)
    }
    downloadYearAuto(year) {
        var initURL = this.getScoreURL(year);
        this.getSubURL(initURL,(html) => {
            console.log("Processing " + initURL);
            this.downloadYear(html,this.getYearDir(year));
        })
    }
    parsePage(html) {

    }
    downloadYear(initPage,destination) {
        mkdirp.sync(destination);
        var init = this.parsePage(initPage);
        init.weeks.forEach((week)=> {
            if(!fs.existsSync(destination + this.weekName(week))) {
                console.log("Downloading " + destination + this.weekName(week) + " ...")
                this.getSubURL(week.href,(html) => {
                fs.writeFile(destination + this.weekName(week),html,(err) => {
                    if(err) {
                        console.log(err);
                        throw err;
                    }
                    console.log("Written " + destination + this.weekName(week));
                })
                })
            } else {
                console.log(destination + this.weekName(week) + " already exists.")
            }
        })
        if(!fs.existsSync(this.scoreLocation(init.year))) {
            console.log("Downloading " + this.scoreLocation(init.year)+ " ...")
            this.getSubURL(this.getScoreURL(init.year),(html) => {
                fs.writeFile(this.scoreLocation(init.year),html,(err) => {
                    if(err) {
                        console.log(err);
                        throw err;
                    }
                    console.log("Written " + this.scoreLocation(init.year));
                })
            })
        } else {
            console.log(this.scoreLocation(init.year) + " already exists.")
        }
        
        
    }
    parseFolder(dir) {
        var matchups = [];
        var files = fs.readdirSync(dir);
        files.forEach((file) => {
            var html = fs.readFileSync(dir + "/" + file,"utf8")
            matchups = matchups.concat(this.parsePage(html).matchups);
        })
        return matchups;
    }
    parseYear(year) {
        return this.parseFolder(this.getYearDir(year));
    }
}
module.exports.Parser = parserClass;