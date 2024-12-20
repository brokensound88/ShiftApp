import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCustomerData } from '../../../hooks/useCustomerData';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
}

export function RealTimeStocks() {
  const { accounts } = useCustomerData();
  const [stocks, setStocks] = useState<StockPrice[]>([]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const newStocks = accounts.investment?.positions.map(position => ({
        symbol: position.symbol,
        price: position.value / position.shares * (1 + (Math.random() * 0.02 - 0.01)),
        change: Math.random() * 4 - 2,
      })) || [];
      setStocks(newStocks);
    }, 5000);

    return () => clearInterval(interval);
  }, [accounts]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Real-Time Stock Prices</h3>
      <div className="space-y-4">
        {stocks.map((stock) => (
          <div key={stock.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium">{stock.symbol}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">${stock.price.toFixed(2)}</span>
              <span className={`flex items-center ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stock.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(stock.change).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}