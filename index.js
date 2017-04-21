builder = require("xmlbuilder");

footballdb = require("./parse/footballdb");

// var page = fs.readFileSync("fb_test.html","utf8");

function main() {
    footballdb.downloadYearAuto(2012);

    //  var matchups = footballdb.parseFolder(footballdb.getYearDir(2012));
    //  var graph = getGraphBasic(matchups);
    //  fs.writeFileSync("dataHITS.csv",renderCSV(graph));

}
function getGraphHITS(matchups) {
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
            source:homeID,
            target:awayID,
            weight:matchup.away.score
        })
        edges.push({
            source:awayID,
            target:homeID,
            weight:matchup.home.score
        })
    })
    return {
        nodes:nodes,
        edges:edges
    };
}
function getNameHome(name) {
    return name + "HOME"
}
function getNameAway(name) {
    return name + "AWAY"
}

function getGraphHITSHomeAway(matchups) {
    var nodes = []; // teams
    var edges = []; // matchups
    matchups.forEach((matchup) => {
        var homeID = nodes.indexOf(getNameHome(matchup.home.name))
        var awayID = nodes.indexOf(getNameAway(matchup.away.name))
        if( homeID == -1) {
            homeID = nodes.push(getNameHome(matchup.home.name)) - 1
        }
        if( awayID == -1) {
            awayID = nodes.push(getNameAway(matchup.away.name)) - 1
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
            source:awayID,
            target:homeID,
            weight:matchup.home.score
        })
    })
    return {
        nodes:nodes,
        edges:edges
    };
}
function getGraphBasic(matchups) {
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
            week:matchup.week,
            source:loserID,
            target:winnerID,
            weight:1
        })
    })
    return {
        nodes:nodes,
        edges:edges
    };
}
function renderCSV(graph) {
    var out = "home,homeID,away,awayID,year,home_score,away_score,is_event \n";
    graph.edges.forEach((edge)=>{
        out+= graph.nodes[edge.home.id] + ","
            + "n" + edge.home.id + ","
            + graph.nodes[edge.away.id] + ","
            + "n" + edge.away.id + ","
            + edge.year + ","
            + edge.home.score + ","
            + edge.away.score + ","
            + (edge.event != "") + "\n";
    })
    return out;
}
function renderXML(graph) {
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
    xml.ele("key",{
        id:"d5",
        for:"edge",
        'attr.name':"weight",
        'attr.type':"double"
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
            source:"n"+edge.source,
            target:"n"+edge.target,
        })
            .ele("data",{key:"d5"},edge.weight).up()
            // .ele("data",{key:"d1"},Math.abs(edge.home.score - edge.away.score)).up()
            // .ele("data",{key:"d2"},edge.date).up()
            // .ele("data",{key:"d3"},edge.event).up()
            // .ele("data",{key:"d4"},edge.home.id)
    })
    
    xml.end({pretty:true});

    // console.log(xml);
    return xml;
}
function makeXMLWinEdges(graph) {
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

function makeXMLHITSScores(graph) {
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

// downloadYear(page);
main();
