import { create } from 'zustand';
import { TimeRange } from '../components/dashboard/analytics/chart/types';

interface StockData {
  symbol: string;
  price: number;
  data: DataPoint[];
}

interface DataPoint {
  date: string;
  value: number;
}

interface StockDataState {
  stocks: Record<string, StockData>;
  fetchStockData: (symbol: string, timeRange: TimeRange) => Promise<void>;
}

const generateStockData = (symbol: string, timeRange: TimeRange): StockData => {
  const data: DataPoint[] = [];
  const now = new Date();
  let days: number;
  
  switch (timeRange) {
    case '1D': days = 1; break;
    case '1W': days = 7; break;
    case '1M': days = 30; break;
    case '3M': days = 90; break;
    case '1Y': days = 365; break;
    case 'ALL': days = 1825; break;
  }

  let baseValue = {
    'AAPL': 180,
    'GOOGL': 140,
    'VTI': 220,
  }[symbol] || 100;

  let value = baseValue;
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value = value * (1 + (Math.random() * 0.02 - 0.01));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Number(value.toFixed(2)),
    });
  }

  return {
    symbol,
    price: value,
    data,
  };
};

export const useStockData = create<StockDataState>((set, get) => ({
  stocks: {},
  fetchStockData: async (symbol: string, timeRange: TimeRange) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const stockData = generateStockData(symbol, timeRange);
    
    set(state => ({
      stocks: {
        ...state.stocks,
        [symbol]: stockData,
      },
    }));
  },
}));