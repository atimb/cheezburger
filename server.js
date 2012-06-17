var express = require('express');
var config = require('./conf/config.json');
var app = express.createServer(express.static(__dirname + '/web'), express.logger(), express.bodyParser());
var port = process.env.PORT || 8080;

var Salesforce = require("./lib/salesforce-connector")(config.SALESFORCE);
var RestApi = require("./lib/rest-api.js");

// Bootstrap the server
Salesforce.login(function() {
    RestApi.bind(app, Salesforce);
    app.listen(port, function() {
        console.log("Listening on " + port);
    });
});
