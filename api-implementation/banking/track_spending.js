"use strict"

var moment = require('moment');

var AccountService = require('./AccountService');

// An example of the incoming nonstandard duration field format:
// "Sat Feb 18 2017 16:00:00 GMT-0500 (EST)"
function momentFromDurationField(durationField) {
    var re = /(.*) GMT(.*) \(.*/;
    var results = re.exec(input);
    var parsableTime = results[1] + ' ' + results[2];
    return moment(parsableTime, 'ddd MMM DD YYYY HH:mm:ss ZZZZZ');
};

module.exports = {

    metadata: () => ({
        "name": "TrackSpending",
        "properties": {
            "spendingCategory": { "type": "string", "required": true },
            "date": { "type": "string", "required": false},
            "durationStart": { "type": "string", "required": false},
            "durationEnd": { "type": "string", "required": false}
        },
        "supportedActions": [
        ]
    }),

    invoke: (conversation, done) => {
        var spendingCategory = conversation.properties().spendingCategory;

        // Only expect date OR duration to be present, not both; this
        // is a result of how the entity detection is currently working.
        // For example: "yesterday" or "June 2nd" will be detected as a DATE,
        // but "last week" or "June" will be detected as a DURATION.
        var date = conversation.properties().date;
        var durationStart = conversation.properties().durationStart;
        var durationEnd = conversation.properties().durationEnd;

        var durationFilter = undefined;

        // BUGBUG: workaround for https://jira.oraclecorp.com/jira/browse/MIECS-2748
        date = date.startsWith('${') ? null : date;
        durationStart = durationStart.startsWith('${') ? null : durationStart;
        durationEnd = durationEnd.startsWith('${') ? null : durationEnd;

        if (spendingCategory) {
            spendingCategory = spendingCategory.toLowerCase();
        }

        conversation.logger().info('TrackSpending: getting txns for category=' + spendingCategory + ' date=' + date + ' durationStart=' + durationStart + ' durationEnd=' + durationEnd);

        if (date) {
            // So far, only individual days are detected as DATE.  More fine-grained
            // DATE values are possible, but not particularly meaningful, so we just
            // treat all DATE values as meaning "duration of the day that the DATE
            // falls within".
            durationFilter = {
                from: moment(date).startOf('day'),
                to: moment(date).endOf('day')
            };
        }

        if (durationStart && durationEnd) {
            durationFilter = {
                from: moment(Number.parseInt(durationStart, 10)),
                to: moment(Number.parseInt(durationEnd, 10))
            };
        }

        if (durationFilter) {
            conversation.logger().info('TrackSpending: durationFilter=' + JSON.stringify(durationFilter));
        }

        var accounts = AccountService.accounts('credit card');
        if (accounts.length > 0) {
            var account = accounts[0];
            var categoryBalance = account.balance({category: spendingCategory, duration: durationFilter});
            conversation.reply({ text: 'You\'ve spent $' + (-categoryBalance) + ' on ' + spendingCategory});
        }
        else {
            conversation.logger().info('TrackSpending: no accounts of specified type found!');
            conversation.reply({ text: 'Sorry, you don\'t have a ' + accountType + ' account!' });
        }

        conversation.transition();

        done();
    }
};
