/**
 * Salesforce (database.com) singleton DAO object
 */
var Salesforce = function(config) {

    var sf = require('node-salesforce');
    var conn = new sf.Connection({
        clientId : config.clientId,
        clientSecret : config.clientSecret,
        redirectUri : config.redirectUri
    });

    return {
        /**
         * Acquire access token with OAuth2 client credentials
         */
        login: function(cb) {
            conn.login(config.username, config.passwordAndToken, function(err) {
                if (err) {
                    console.log(err);
                    throw "Cannot connect to database.com!";
                }
                cb();
            });
        },
        /**
         * Retrieve a list of all Accounts (locations)
         */
        getLocations: function(cb) {
            conn.query("SELECT Id, Name, lat__c, long__c FROM Account__c", function(err, result) {
                if (err) {
                    console.log(err);
                    throw "Cannot retrieve Accounts";
                }
                var locations = [];
                result.records.forEach(function(el) {
                    locations.push({ id: el.Id, name: el.Name, lat: el.lat__c, long: el.long__c });
                });
                cb(locations);
            });
        },
        /**
         * Returns a patron's id by his nickname
         */
        getPatronIdByName: function(patron_name, cb) {
            conn.query("SELECT Id FROM patron__c WHERE Name = '"+escape(patron_name)+"'", function(err, result) {
                if (err) {
                    console.log(err);
                    throw "Cannot retrieve Patron";
                }
                if (result.totalSize == 0) {
                    cb(null);
                } else {
                    cb(result.records[0].Id);
                }
            });
        },
        /**
         * Checks if a specific patron exists, if not, creates it
         */
        ensurePatronExists: function(patron_name, cb) {
            var self = this;
            self.getPatronIdByName(patron_name, function(id) {
                if (id !== null) {
                    cb(id);
                } else {
                    conn.sobject("patron__c").create({ Name : patron_name }, function(err, ret) {
                        if (err || !ret.success) {
                            console.log(err, ret);
                            throw "Cannot create Patron";
                        }
                        self.getPatronIdByName(patron_name, function(id) {
                            if (id === null) {
                                throw "Patron not found after creation";
                            }
                            cb(id);
                        });
                    });
                }
            });
        },
        /**
         * Saves a specific score associated to a specific location and patron
         */
        saveScore: function(account_id, patron_name, points, cb) {
            this.ensurePatronExists(patron_name, function(patron_id) {
                conn.sobject("score__c").create({ patron__c : patron_id, account__c : account_id, points__c: points }, function(err, ret) {
                    if (err || !ret.success) {
                        console.log(err, ret);
                        throw "Cannot save Score";
                    }
                    cb();
                });
            });
        },
        /**
         * Retrieves the high scores globally, decreasing order, top 5 records
         */
        getHighScores: function(cb) {
            conn.query("SELECT points__c, patron__r.Name FROM score__c ORDER BY points__c DESC LIMIT 5", function(err, result) {
                if (err) {
                    console.log(err);
                    throw "Cannot retrieve Scores";
                }
                var high_scores = [];
                result.records.forEach(function(el) {
                    high_scores.push({ points: el.points__c, name: el.patron__r.Name });
                });
                cb(high_scores);
            });
        },
        /**
         * Retrieves the high scores for a given location, decreasing order, top 5 records
         */
        getHighScoresByLocation: function(account_id, cb) {
            conn.query("SELECT points__c, patron__r.Name FROM score__c WHERE account__c = '"+escape(account_id)+"' ORDER BY points__c DESC LIMIT 5", function(err, result) {
                if (err) {
                    console.log(err);
                    throw "Cannot retrieve Scores";
                }
                var high_scores = [];
                result.records.forEach(function(el) {
                    high_scores.push({ points: el.points__c, name: el.patron__r.Name });
                });
                cb(high_scores);
            });
        },
        /**
         * Creates sample records (for testing with empty database.com)
         */
        createSampleRecords: function() {
            conn.sobject("Account__c").create({ Name : 'Mission College, Santa Clara', lat__c: 37.388046, long__c: -121.982133 }, function(){});
            conn.sobject("Account__c").create({ Name : 'Union Square, San Francisco', lat__c: 37.772004, long__c: -122.423658 }, function(){});
            conn.sobject("Account__c").create({ Name : 'Downtown, San Diego', lat__c: 32.717688, long__c: -117.15992 }, function(){});
        }
    }
};

module.exports = function(config) {
    return Salesforce(config);
}

// Against SQL injection attack
function escape(str) {
    return (str+'').replace("'", "\\'");
}
