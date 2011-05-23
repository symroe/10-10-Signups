var util = require('util')
var async = require('async')
var redis = require("redis")
var journey = require('journey');
var client = redis.createClient();
client.select('0')
client.on("error", function (err) {
    console.log("Error " + err);
});

var path = require('path'),
    sys = require('sys');

//
// Create a Router object with an associated routing table
//
var router = new(journey.Router)(function (map) {
    map.get(/^node\/date_range\/(\d+)\/(\d+)\/$/).bind(function (res, start, end) {
        client.zrangebyscore("all_signups", start, end, function(err, reply) {
            res.send(200, {}, reply);
        });
    });

    map.get(/^node\/news_date_range\/(\d+)\/(\d+)\/$/).bind(function (res, start, end) {
        client.zrangebyscore("all_news", start, end, function(err, reply) {
            res.send(200, {}, reply);
        });
    });

    map.get(/^node\/get_single\/(.*)$/).bind(function (res, key) {
        client.hgetall(key+"::hash", function(err, reply) {
            res.send(200, {}, reply);
        });
    });

    map.get(/^node\/day_buckets$/).bind(function (res) {
        var buckets = new Array();
        start = 1251763241;
        step = 86400*2;
        async.whilst(
            function() { return start <= 1305889167},
            function(callback) {
                client.zrangebyscore("all_signups", start, start+step, function(err, reply) {
                buckets.push(reply.length);
                start = start+step;
                callback();
            })},
            function(err) {res.send(200, {}, buckets);}
            );
    });
});

require('http').createServer(function (request, response) {
    var body = "";

    request.addListener('data', function (chunk) { body += chunk });
    request.addListener('end', function () {
        //
        // Dispatch the request to the router
        //
        router.route(request, body, function (result) {
            response.writeHead(result.status, result.headers);
            response.end(result.body);
        });
    });
}).listen(8080);
