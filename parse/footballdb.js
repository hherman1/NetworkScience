parse = require("./parse")
cheerio = require("cheerio");


class FootballDBParser extends parse.Parser {
    constructor() {
        super();
        this.basedir = "footballdb/"
        this.baseurl = "http://www.footballdb.com/"
    }
    weekName(week) {
        return week.name+"-"+week.year+".html";
    }

    getYearDir(year) {
        return this.basedir+year+"/weeks/"
    }
    getScoreURL(year) {
        return "http://www.footballdb.com/college-football/scores.html?yr="+year+"&conf="
    }
    
    scoreLocation(year) {
        return this.weekdir+"score"+"-"+year+".html";
    }

    parsePage(html) {
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
                var gameParsed = this.getGame($,game);
                gameParsed.date = dateParsed.toUTCString();
                gameParsed.year = out.year;
                gameParsed.week = out.currentWeek;
                matchups.push(gameParsed);
            })
        });
        out.matchups = matchups;

        return out;
    }

    getGame($,sbgame) {
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
}
module.exports = FootballDBParser;