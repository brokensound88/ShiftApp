import { InvestmentAccount } from '../../types/customer';

export const investmentAccounts: InvestmentAccount[] = [
  {
    id: 'inv-gs-001',
    type: 'Brokerage',
    balance: 400000,
    institution: 'Goldman Sachs',
    positions: [
      { symbol: 'VTI', shares: 850, value: 180000, basis: 150000 },
      { symbol: 'VXUS', shares: 600, value: 40000, basis: 35000 },
      { symbol: 'BND', shares: 400, value: 40000, basis: 42000 },
      { symbol: 'VNQ', shares: 300, value: 28000, basis: 25000 },
      { symbol: 'VTIP', shares: 450, value: 42000, basis: 40000 },
      { symbol: 'VGIT', shares: 700, value: 70000, basis: 65000 }
    ]
  },
  {
    id: 'inv-rh-001',
    type: 'Brokerage',
    balance: 604000,
    institution: 'Robinhood',
    positions: [
      { symbol: 'TSLA', shares: 450, value: 180000, basis: 120000 },
      { symbol: 'NVDA', shares: 40, value: 24000, basis: 15000 },
      { symbol: 'AAPL', shares: 500, value: 95000, basis: 75000 },
      { symbol: 'GOOGL', shares: 200, value: 85000, basis: 70000 },
      { symbol: 'MSFT', shares: 200, value: 80000, basis: 60000 },
      { symbol: 'META', shares: 150, value: 60000, basis: 45000 },
      { symbol: 'AMZN', shares: 300, value: 80000, basis: 65000 }
    ]
  }
];