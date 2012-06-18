var express = require('express');
var app = express.createServer(express.static(__dirname + '/web'), express.logger(), express.bodyParser());
var config = require('./conf/config.json');
var port = process.env.PORT || 8080;

var Salesforce = require("./lib/salesforce-connector")(config.SALESFORCE);
var RestApi = require("./lib/rest-api.js");

// Bootstrap the server
Salesforce.login(function() {
    RestApi.bind(app, Salesforce);
    app.listen(port, function() {
        console.log("Authenticated to Database.com. Listening on " + port);
    });
});
