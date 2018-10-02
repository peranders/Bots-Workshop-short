"use strict";

var moment = require('moment');

var AccountService = require('./AccountService');

module.exports = {

    metadata: () => ({
        "name": "TransactionsRetrieval",
        "properties": {
            "accountType": { "type": "string", "required": true },
            "txnType": { "type": "string", "required": true },
            "txnSelector": { "type": "string", "required": true },
            "nlpVariable": { "type": "string", "required": true }
        },
        "supportedActions": [
        ]
    }),

    invoke: (conversation, done) => {
        var accountType = conversation.properties().accountType.toLowerCase();
        var txnType = conversation.properties().txnType;
        var txnSelector = conversation.properties().txnSelector;

        txnSelector = conversation.resolveVariable(txnSelector); // WORKAROUND MIECS-2748

        var requestedNumOfTxns = 10; // default to 10

        var durationFilter;

        var nlpVariable = conversation.properties().nlpVariable;
        var nlpResult = conversation.nlpResult(nlpVariable);
        var date = nlpResult.entityMatches('DATE')[0];
        var dateSpecifier = nlpResult.entityMatches('DateSpecifier')[0];

        const txnTypeMap = {
          'deposits': 'deposit',
          'withdrawals': 'withdrawal',
          'payments': 'payment',
          'checks': 'check',
          'debits': 'debit',
          'credits': 'credit'
        };

        const selectorMap = {
          'last 10': 10,
          'last 9': 9,
          'last 8': 8,
          'last 7': 7,
          'last 6': 6,
          'last 5': 5,
          'last 4': 4,
          'last 3': 3,
          'last 2': 2,
          'last': 1
        };

        conversation.logger().info('TransactionsRetrieval: getting txns for account type ' + accountType +
                     ' txnType=' + txnType + ' txnSelector=' + txnSelector);

        if (txnSelector) {
            requestedNumOfTxns = selectorMap[txnSelector];
        }

        // TODO: refactor this into SDK, remove dup in track_spending
        // and eventually delete it when entity detection is fixed
        var durationClause = '';
        if (date && dateSpecifier) {
            // Date is now "ms from Unix Epoch" as a string, convert to JS number type
            date = Number.parseInt(date, 10);
            switch (dateSpecifier) {
                case 'yesterday': {
                    durationFilter = {
                        from: moment(date).startOf('day'),
                        to: moment(date).endOf('day')
                    };
                    durationClause = ' from yesterday';
                    break;
                }
                case 'last weekend': {
                    durationFilter = {
                        from: moment().isoWeekday(-1).startOf('day'),
                        to: moment().isoWeekday(0).endOf('day')
                    };
                    durationClause = ' from last weekend';
                    break;
                }
                case 'last week': {
                    durationFilter = {
                        from: moment(date).startOf('week'),
                        to: moment(date).endOf('week')
                    };
                    durationClause = ' from last week';
                    break;
                }
                case 'last month': {
                    durationFilter = {
                        from: moment(date).startOf('month'),
                        to: moment(date).endOf('month')
                    };
                    durationClause = ' from last month';
                    break;
                }
                default: {
                    break;
                }
            }
            if (durationFilter) {
                conversation.logger().info('TransactionsRetrieval: duration=' + JSON.stringify(durationFilter));
            }
        }

        var accounts = AccountService.accounts(accountType);
        if (accounts.length > 0) {
            let txnsText = 'Here are the ' + requestedNumOfTxns + ' most recent ' + txnType + ' in your ' + accountType + ' account' + durationClause + '. ';
            var account = accounts[0];
            var txns;
            if (txnType !== 'all' && txnTypeMap[txnType] !== undefined) {
                let filter = { type: txnTypeMap[txnType] };
                if (durationFilter) {
                    filter.duration = durationFilter;
                }
                txns = account.lastNTxns(requestedNumOfTxns, filter);
            }
            else {
                let filter;
                if (durationFilter) {
                    filter = {duration: durationFilter};
                }
                txns = account.lastNTxns(requestedNumOfTxns, filter);
            }

            if (txns && txns.length > 0) {
              conversation.reply(txnsText);
            }
            var MessageModel = conversation.MessageModel();
            var cards = txns.map(function(txn, index){
              var dateStr = moment.utc(txn.date).format("MMMM DD, YYYY");
              var txnsTitle = (accountType === 'credit card' ? '#' + (index+1) + ' - ' + txn.description : '#' + (index+1));
              var txnsSubtitle = dateStr + ' > $' + String(txn.amount);
              var imageUrl=null;
              switch (txn.category)
                {
                   case "travel":
                       imageUrl = "https://res.cloudinary.com/dj21m905v/image/upload/v1509146377/FinBot/bon-voyage.jpg";
                       break;
                   case "gas":
                       imageUrl = "https://res.cloudinary.com/dj21m905v/image/upload/v1509148287/FinBot/petrol-stations.png";
                       break;
                   case "uber":
                       imageUrl = "https://res.cloudinary.com/dj21m905v/image/upload/v1509148287/FinBot/taxi.png";
                       break;
                   case "restaurants":
                       imageUrl = "https://res.cloudinary.com/dj21m905v/image/upload/v1509148287/FinBot/restaurant.png";
                       break;
                   case "retail":
                       imageUrl = "https://res.cloudinary.com/dj21m905v/image/upload/v1509148287/FinBot/supermarket.png";
                       break;
                }
              if (imageUrl) {
                var action = MessageModel.urlActionObject('Open', null, imageUrl);
                return MessageModel.cardObject(txnsTitle, txnsSubtitle, imageUrl, null, [action]);
              } else {
                return MessageModel.cardObject(txnsTitle, txnsSubtitle);
              }
            });
            var txnCardConversationMessage = MessageModel.cardConversationMessage('horizontal', cards);
            conversation.reply(txnCardConversationMessage);
        }
        else {
            conversation.logger().info('TransactionsRetrieval: no accounts of specified type found!');
            conversation.reply({ text: 'Sorry, you don\'t have a ' + accountType + ' account!' });
        }

        conversation.transition();

        done();
    }
};
