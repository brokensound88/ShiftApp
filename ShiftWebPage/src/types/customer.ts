export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'debit' | 'credit';
}

export interface BankAccount {
  id: string;
  type: string;
  balance: number;
  institution: string;
  accountNumber: string;
  apy?: number;
  transactions: Transaction[];
}

export interface InvestmentAccount {
  id: string;
  type: string;
  balance: number;
  institution: string;
  positions: Position[];
}

export interface Position {
  symbol: string;
  shares: number;
  value: number;
  basis: number;
}