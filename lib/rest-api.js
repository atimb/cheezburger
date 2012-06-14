/**
 * Singleton object exposing Rest API to game clients
 */
RestApi = {
    bind: function(app, Salesforce) {
        /**
         * Client is posting a new score
         */
        app.post('/api/score', function(req, res) {
            try {
                Salesforce.saveScore(req.body.location, req.body.nickname, req.body.points, function() {
                    res.send({ success: true });
                });
            } catch(e) {
                console.log(e);
                res.send({ success: false });
            }
        });

        /**
         * Client is requesting leaderboard for a specific location
         */
        app.get('/api/highscore/:location', function(req, res) {
            try {
                Salesforce.getHighScoresByLocation(req.params.location, function(high_scores) {
                    res.send(high_scores);
                });
            } catch(e) {
                console.log(e);
                res.send([]);
            }
        });
        
        /**
         * Client is retrieving franchise locations
         */
        app.get('/api/locations', function(req, res) {
            try {
                Salesforce.getLocations(function(locations) {
                    res.send(locations);
                });
            } catch(e) {
                console.log(e);
                res.send([]);
            }
        });
    }
};

module.exports = RestApi;
