module.exports = {};
var weekdir = "footballdb/weeks/";
module.exports.weekdir = weekdir;

function weekLocation(week) {
    return footballdb.weekdir+week.name+"-"+week.year+".html";
}
module.exports.weekLocation = weekLocation;

function downloadYear(initPage) {
    try {
        fs.mkdirSync(weekdir);
    } catch(err) {
        if(err.code !== 'EEXIST') {
            console.log(err);
            throw e;
        }
    };
    var init = parsePage(initPage);
    init.weeks.forEach((week)=> {
        if(!fs.existsSync(weekLocation(week))) {
            console.log("Downloading " + weekLocation(week) + " ...")
            getPage(week.href,(html) => {
               fs.writeFile(weekLocation(week),html,(err) => {
                   if(err) {
                       console.log(err);
                       throw err;
                   }
                   console.log("Written " + weekLocation(week));
               })
            })
        } else {
            console.log(weekLocation(week) + " already exists.")
        }
    })
    if(!fs.existsSync(scoreLocation(init.year))) {
        console.log("Downloading " + scoreLocation(init.year)+ " ...")
        getPage(getScoreURL(init.year),(html) => {
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