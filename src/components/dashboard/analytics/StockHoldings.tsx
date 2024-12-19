import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { useCustomerData } from '../../../hooks/useCustomerData';
import { useStockSelection } from '../../../hooks/useStockSelection';

export function StockHoldings() {
  const { accounts } = useCustomerData();
  const { selectedStock, setSelectedStock } = useStockSelection();
  const positions = accounts.investment?.positions || [];
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Current Holdings</h3>
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        {positions.map((position) => {
          const percentOfPortfolio = ((position.value / totalValue) * 100).toFixed(1);
          const gainLoss = Math.random() * 20 - 10; // Simulated gain/loss
          const isSelected = selectedStock === position.symbol;
          
          return (
            <button
              key={position.symbol}
              onClick={() => setSelectedStock(isSelected ? null : position.symbol)}
              className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                isSelected 
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{position.symbol}</span>
                  <span className={`flex items-center text-sm ${
                    gainLoss >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {gainLoss >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(gainLoss).toFixed(2)}%
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {position.shares} shares
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium">
                  ${position.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {percentOfPortfolio}% of portfolio
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Portfolio Value</span>
          <span className="font-semibold">${totalValue.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
}