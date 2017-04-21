http = require("http");
cheerio = require("cheerio");
fs = require("fs");
url = require("url");
mkdirp = require("mkdirp");


module.exports = {};
var weekdir = "footballdb/weeks/";
module.exports.weekdir = weekdir;

var defaultHost = "http://www.footballdb.com";

function getFBPage(uri,callback) {
    return getPage(url.resolve(defaultHost,uri),callback)
}
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

function weekName(week) {
    return week.name+"-"+week.year+".html";
}
module.exports.weekName = weekName;

function getYearDir(year) {
    return "footballdb/"+year+"/weeks/"
}
module.exports.getYearDir = getYearDir;

function downloadYearAuto(year) {
    var initURL = getScoreURL(year);
    getFBPage(initURL,(html) => {
        downloadYear(html,getYearDir(year));
    })
}
module.exports.downloadYearAuto = downloadYearAuto;


function downloadYear(initPage,destination) {
    if(destination == undefined) {
        destination = weekdir;
    }
    mkdirp.sync(destination);
    var init = parsePage(initPage);
    init.weeks.forEach((week)=> {
        if(!fs.existsSync(destination + weekName(week))) {
            console.log("Downloading " + destination + weekName(week) + " ...")
            getFBPage(week.href,(html) => {
               fs.writeFile(destination + weekName(week),html,(err) => {
                   if(err) {
                       console.log(err);
                       throw err;
                   }
                   console.log("Written " + destination + weekName(week));
               })
            })
        } else {
            console.log(destination + weekName(week) + " already exists.")
        }
    })
    if(!fs.existsSync(scoreLocation(init.year))) {
        console.log("Downloading " + scoreLocation(init.year)+ " ...")
        getFBPage(getScoreURL(init.year),(html) => {
            fs.writeFile(scoreLocation(init.year),html,(err) => {
                if(err) {
                    console.log(err);
                    throw err;
                }
                console.log("Written " + scoreLocation(init.year));
            })
        })
    } else {
        console.log(scoreLocation(init.year) + " already exists.")
    }
    
    
}
module.exports.downloadYear = downloadYear;

function getScoreURL(year) {
    return "http://www.footballdb.com/college-football/scores.html?yr="+year+"&conf="
}
module.exports.getScoreURL = getScoreURL;
function scoreLocation(year) {
    return weekdir+"score"+"-"+year+".html";
}
module.exports.scoreLocation = scoreLocation;

function parseFolder(dir,callback) {
    var matchups = [];
    var files = fs.readdirSync(dir);
    files.forEach((file) => {
        var html = fs.readFileSync(dir + "/" + file,"utf8")
        matchups = matchups.concat(parsePage(html).matchups);
    })
    return matchups;
}
module.exports.parseFolder = parseFolder;

function parsePage(html) {
    var out = {};
    var $ = cheerio.load(html);


    out.year = parseInt($("#leftcol>h1").text().slice(0,4));

    var weeks = [];
    var weekButtons = $(".hidden-xs>.btn-group>a");
    weekButtons.each((i,week) => {
        var weekParsed = {};
        weekParsed.href = week.attribs["href"];
        weekParsed.name = $(week).text();
        weekParsed.year = out.year;
        weeks.push(weekParsed);
    });
    out.weeks = weeks;
    out.currentWeek = $(".hidden-xs>.btn-group>.active").text();

    var matchups = [];
    $(".divider").each((i,date) => {
        var dateParsed = new Date(Date.parse($(date).text()));
        //console.log(dateParsed.toUTCString());
        //console.log(getTeam($,));
        $(date).nextUntil(".divider")
        .find(".sbgame")
        .each((i,game) => {
            var gameParsed = getGame($,game);
            gameParsed.date = dateParsed.toUTCString();
            gameParsed.year = out.year;
            gameParsed.week = out.currentWeek;
            matchups.push(gameParsed);
        })
    });
    out.matchups = matchups;

    return out;
}
module.exports.parsePage = parsePage;

function getGame($,sbgame) {
    var event = $(sbgame).children("div").first().children("b").text();
    var teamsData = [];
    $(".row0",sbgame).each((i,team) => {
        var data = {};
        var cells = $("td",team);
        data.name = cells.first().find("a").text()
        || cells.first().find("b").text()
        || cells.first().text();
        data.score = parseInt(cells.last().text());
        data.won = false;
        teamsData.push(data);
    })
    if(teamsData[0].score > teamsData[1].score)
        teamsData[0].won = true;
    else
        teamsData[1].won = true;
    return {
        home:teamsData[1],
        away:teamsData[0],
        event:event
    }
}
module.exports.getGame = getGame;