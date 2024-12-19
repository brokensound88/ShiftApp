import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { useCustomerData } from '../../../hooks/useCustomerData';

const COLORS = ['#2563eb', '#16a34a', '#eab308'];

export function PortfolioOverview() {
  const { accounts } = useCustomerData();
  const { retirement } = accounts;

  // Calculate total portfolio value
  const totalValue = retirement?.accounts.reduce((sum, account) => sum + account.balance, 0) || 0;

  // Combine allocation data from all retirement accounts
  const combinedAllocation = retirement?.accounts.reduce((acc, account) => {
    const weight = account.balance / totalValue;
    return {
      stocks: acc.stocks + (account.allocation.stocks * weight),
      bonds: acc.bonds + (account.allocation.bonds * weight),
      cash: acc.cash + (account.allocation.cash * weight),
    };
  }, { stocks: 0, bonds: 0, cash: 0 });

  const data = [
    { name: 'Stocks', value: combinedAllocation?.stocks || 0 },
    { name: 'Bonds', value: combinedAllocation?.bonds || 0 },
    { name: 'Cash', value: combinedAllocation?.cash || 0 },
  ];

  const averageReturn = retirement?.accounts.reduce((sum, account) => 
    sum + (account.yearToDateReturn * (account.balance / totalValue)), 0
  ) || 0;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Asset Allocation</h3>
          <p className="text-sm text-gray-600">Total Portfolio: ${totalValue.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">YTD Return</p>
          <p className={`text-lg font-semibold ${averageReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {averageReturn.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name} (${value.toFixed(1)}%)`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}