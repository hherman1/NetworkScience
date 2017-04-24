parse = require("./parse")
cheerio = require("cheerio");


class NCAAParser extends parse.Parser {
    constructor(division,conference) {
        super();
        this.division = division==undefined?"d3":division;
        this.basedir = "ncaa/"
        this.baseurl = "http://www.ncaa.com/"
        this.conference = conference;
    }
    getScoreURL(year) {
        return "http://www.ncaa.com/scoreboard/football/"+this.division+"/"+year+"/01/" + this.getConferenceURLAddition()
    }
    getConferenceURLAddition() {
        return this.conference == undefined ? "" : this.conference
    }
    getConferenceDirName() {
        return this.conference == undefined ? "all" : this.conference
    }
    getYearDir(year) {
        return this.basedir+year+"/"+this.division+"/"+this.getConferenceDirName()+"/weeks/"
    }

    parsePage(html) {
        var out = {};
        var $ = cheerio.load(html);

        var dateText = $(".day-wrapper").first().text().trim();
        var yearText = dateText.substring(dateText.lastIndexOf(",")+1).trim();
        out.year = parseInt(yearText);

        var weeks = [];
        var weekButtons = $(".dates.weekly>li>a");
        weekButtons.each((i,week) => {
            var weekParsed = {};
            weekParsed.href = week.attribs["href"] + "/" + this.getConferenceURLAddition();
            weekParsed.name = $(week).text().trim();
            weekParsed.year = out.year;
            weeks.push(weekParsed);
        });
        out.weeks = weeks;
        out.currentWeek = $(".dates.weekly>li.selected>a").text().trim();

        var matchups = [];
        $(".day-wrapper").each((i,date) => {
            var dateParsed = new Date(Date.parse($(date).text()));
            $(date).nextUntil(".day-wrapper")
            .filter("section.game")
            .each((i,game) => {
                var gameParsed = this.getGame($,game);
                if(gameParsed != null) {
                    gameParsed.date = dateParsed.toUTCString();
                    gameParsed.year = out.year;
                    gameParsed.week = out.currentWeek;
                    matchups.push(gameParsed);
                }
            })
        });
        out.matchups = matchups;

        return out;
    }

    getGame($,sbgame) {
        var event = $(sbgame).children("div.game-contents").children(".game-championship").text();
        var teamsData = [];
        $("table.linescore tr",sbgame).each((i,team) => {
            var data = {};
            if($(".team",team).length > 0) {
                data.name = $(".team>a",team).text();
                // data.name = cells.first().find("a").text()
                // || cells.first().find("b").text()
                // || cells.first().text();
                data.score = parseInt($(".final.score",team).text());
                data.won = false;
                teamsData.push(data);
            }
        })

        if(teamsData[0].score > teamsData[1].score)
            teamsData[0].won = true;
        else
            teamsData[1].won = true;
        if(isNaN(teamsData[0].score) || isNaN(teamsData[1].score)) {
            return null;
        }
        return {
            home:teamsData[1],
            away:teamsData[0],
            event:event
        }
    }
}
module.exports = NCAAParser;