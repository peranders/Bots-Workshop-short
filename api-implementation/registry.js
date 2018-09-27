module.exports = {
  components: {
    // PizzaBot
    'AgeChecker': require('./pizza/age_checker')
	  
    // FinancialBot
    'BalanceRetrieval': require('./banking/balance_retrieval'),
    'TransactionsRetrieval': require('./banking/transactions_retrieval'),
    'TrackSpending': require('./banking/track_spending'),
    'Payments': require('./banking/payments'),
	  
	  	  
  }
};
