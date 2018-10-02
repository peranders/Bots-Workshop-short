"use strict"

var AccountService = require('./AccountService');

module.exports = {

    metadata: () => ({
        "name": "BalanceRetrieval",
        "properties": {
            "accountType": { "type": "string", "required": true }
        },
        "supportedActions": [
        ]
    }),

    invoke: (conversation, done) => {
        var accountType = conversation.properties().accountType;
        conversation.logger().info('BalanceRetrieval: getting balance for account type=' + accountType);

        var accounts = AccountService.accounts(accountType);
        if (accounts.length > 0) {
            var account = accounts[0];
            conversation.logger().info('BalanceRetrieval: account id ' + account.id + ' balance=' + account.balance());
            conversation.reply({ text: 'The balance in your ' + accountType + ' account (' + account.id + ') is $' + String(account.balance()) });
            if (accountType === 'credit card') {
                conversation.reply({ text: 'Your remaining credit is $' + String(account.remainingLimit()) });
            }
        }
        else {
            conversation.logger().info('BalanceRetrieval: no accounts of specified type found!');
            conversation.reply({ text: 'Sorry, you don\'t have a ' + accountType + ' account!' });
        }
        conversation.transition();

        done();
    }
};
