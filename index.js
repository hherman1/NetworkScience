fs = require("fs");
cheerio = require("cheerio");
http = require("http");
builder = require("xmlbuilder");

// var page = fs.readFileSync("fb_test.html","utf8");

var weekdir = "weeks/"

function main() {
    // downloadYear(page);
    var matchups = parseFolder(weekdir);
    var graph = getGraph(matchups);
    fs.writeFileSync("data.graphml",makeXML(graph).toString());
    //console.log(makeXML(graph).toString());
    console.log("graph written");
}

function weekLocation(week) {
    return weekdir+week.name+"-"+week.year+".html";
}
function getGraph(matchups) {
    var nodes = []; // teams
    var edges = []; // matchups
    matchups.forEach((matchup) => {
        var homeID = nodes.indexOf(matchup.home.name)
        var awayID = nodes.indexOf(matchup.away.name)
        if( homeID == -1) {
            homeID = nodes.push(matchup.home.name) - 1
        }
        if( awayID == -1) {
            awayID = nodes.push(matchup.away.name) - 1
        }
        var winnerID;
        var loserID;
        if(matchup.home.won) {
            winnerID = homeID;
            loserID = awayID;
        } else {
            winnerID = awayID;
            loserID = homeID;
        }
        edges.push({
            home:{
                id:homeID,
                score:matchup.home.score,
            },
            away:{
                id:awayID,
                score:matchup.away.score
            },
            winner:winnerID,
            loser:loserID,
            event:matchup.event,
            date:matchup.date,
            year:matchup.year,
            week:matchup.week
        })
    })
    return {
        nodes:nodes,
        edges:edges
    };
}


function makeXML(graph) {
    var xml = builder.create('graphml').att({
        'xmlns':"http://graphml.graphdrawing.org/xmlns",
        'xmlns:xsi':"http://www.w3.org/2001/XMLSchema-instance",
        'xsi:schemaLocation':"http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd"
    })
    // <key id="d0" for="node" attr.name="color" attr.type="string">
    xml.ele("key",{
        id:"d0",
        for:"node",
        'attr.name':"name",
        'attr.type':"string"
    });
    xml.ele("key",{
        id:"d1",
        for:"edge",
        'attr.name':"spread",
        'attr.type':"int"
    });
    xml.ele("key",{
        id:"d4",
        for:"edge",
        'attr.name':"home",
        'attr.type':"int"
    });
    xml.ele("key",{
        id:"d2",
        for:"edge",
        'attr.name':"date",
        'attr.type':"string"
    });
    xml.ele("key",{
        id:"d3",
        for:"edge",
        'attr.name':"event",
        'attr.type':"string"
    });
    var graphNode = xml.ele("graph",{edgedefault:'directed'});
    graph.nodes.forEach((name,index) => {
        graphNode.ele("node",{
            id:"n" + index
        })
        .ele("data",{
            key:"d0"
        },name);
    })
    graph.edges.forEach((edge,id) => {
        graphNode.ele("edge",{
            id:"e"+id,
            source:"n"+edge.loser,
            target:"n"+edge.winner
        })
            .ele("data",{key:"d1"},Math.abs(edge.home.score - edge.away.score)).up()
            .ele("data",{key:"d2"},edge.date).up()
            .ele("data",{key:"d3"},edge.event).up()
            .ele("data",{key:"d4"},edge.home.id)
    })
    
    xml.end({pretty:true});

    // console.log(xml);
    return xml;
}

function getScoreURL(year) {
    return "http://www.footballdb.com/college-football/scores.html?yr="+year+"&conf="
}
function scoreLocation(year) {
    return weekdir+"score"+"-"+year+".html";
}

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
// downloadYear(page);

function parseFolder(dir,callback) {
    var matchups = [];
    var files = fs.readdirSync(dir);
    files.forEach((file) => {
        var html = fs.readFileSync(dir + "/" + file,"utf8")
        matchups = matchups.concat(parsePage(html).matchups);
    })
    return matchups;
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
    })
}
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
main();
