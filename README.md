Cheezburger
==========

HTML5 mobile web app game powered by Heroku and Salesforce

This is an entry for [a CloudSpoke challenge](http://www.cloudspokes.com/challenges/1536).

Live presentation: http://cheezburger.herokuapp.com

## Configuration

* `conf/config.json` contains all salesforce related OAuth2 credentials you need for basic setup
* If you need to modify backend logic (database.com fields with different name, etc.), it's very straightforward in
the `lib/salesforce-connector.js` file
* If you want to customize the UI, you will find the css/images in the `/web` directory

## Deployment

* Create heroku app with `heroku create app-name --stack cedar`, and deploy it with only `git push`,
it will be instantly available

## Database.com relations

The sample setup is the following (according to the challenge requirements):

* `Account__c` object with `lat__c` and `long__c` fields, which are Number(3, 6) data types
* Patron name is stored in `patron__c` object with field `Name`
* Each score submission is stored in `score__c` object with field `points__c`, with lookup relationship to account and patron

When a user submits a score, a new score record is always created. A new patron record is also created, if the patron's name did
not exist before.

## License

MIT license
