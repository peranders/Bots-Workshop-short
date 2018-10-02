"use strict"

var AccountService = require('./AccountService');

module.exports = {

    metadata: () => ({
        "name": "Payments",
        "properties": {
            "fromAccountType": { "type": "string", "required": true },
            "toAccount": { "type" : "string", "required": true },
            "amount": { "type": "CURRENCY", "required": true },
            "date": { "type": "string" },
            "recurrence": { "type": "string" }
        },
        "supportedActions": [
        ]
    }),

    invoke: (conversation, done) => {
        var fromAccountType = conversation.properties().fromAccountType;
        var toAccount = conversation.properties().toAccount;
        var amount = conversation.properties().amount;

        conversation.logger().info('Payments: sending payment fromAccountType ' + fromAccountType +
                     ' toAccount=' + toAccount + ' amount=' + amount);

        conversation.reply({ text: 'Your payment of ' + amount + ' to ' + toAccount + ' has been made from ' + fromAccountType + '.'});

        // TODO: add the payment txn to that account

        conversation.transition();

        done();
    }
};
