import { BankAccount } from '../../types/customer';

export const bankAccounts: BankAccount[] = [
  {
    id: 'chk-gs-001',
    type: 'Checking',
    balance: 25000,
    institution: 'Goldman Sachs',
    accountNumber: '****4567',
    transactions: generateYearOfTransactions('GS-Checking')
  },
  {
    id: 'sav-gs-001',
    type: 'Savings',
    balance: 75000,
    institution: 'Goldman Sachs',
    accountNumber: '****7890',
    apy: 4.5,
    transactions: generateYearOfTransactions('GS-Savings')
  },
  {
    id: 'chk-boa-001',
    type: 'Checking',
    balance: 15000,
    institution: 'Bank of America',
    accountNumber: '****2345',
    transactions: generateYearOfTransactions('BOA-Checking')
  },
  {
    id: 'sav-boa-001',
    type: 'Savings',
    balance: 35000,
    institution: 'Bank of America',
    accountNumber: '****6789',
    apy: 4.2,
    transactions: generateYearOfTransactions('BOA-Savings')
  }
];

function generateYearOfTransactions(accountType: string) {
  const transactions = [];
  const startDate = new Date('2023-03-20');
  const categories = [
    'Groceries', 'Dining', 'Shopping', 'Travel', 'Utilities', 
    'Entertainment', 'Healthcare', 'Education', 'Transportation'
  ];

  // Generate daily transactions for the past year
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - i);

    // Generate 1-3 transactions per day
    const numTransactions = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numTransactions; j++) {
      const amount = Math.floor(Math.random() * 500) + 10;
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      transactions.push({
        id: `${accountType}-${i}-${j}`,
        date: date.toISOString(),
        description: `${category} Transaction`,
        amount: amount,
        category: category,
        type: Math.random() > 0.3 ? 'debit' : 'credit'
      });
    }
  }

  return transactions;
}