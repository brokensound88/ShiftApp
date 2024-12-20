import React from 'react';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useCustomerData } from '../../../hooks/useCustomerData';

interface ProjectionPoint {
  age: number;
  amount: number;
  label: string;
  breakdown: {
    retirement: number;
    investment: number;
    crypto: number;
  };
}

export function RetirementProjection() {
  const { accounts } = useCustomerData();
  const currentAge = 36;
  
  // Get current balances from all investment sources
  const currentBalances = {
    retirement: accounts.retirement?.accounts.reduce((sum, account) => sum + account.balance, 0) || 0,
    investment: accounts.investment?.balance || 0,
    crypto: 300000, // Current crypto holdings
  };

  const projectionData = calculateProjectionPoints(currentAge, currentBalances);
  const finalAmount = projectionData[projectionData.length - 1].amount;
  const targetAge = projectionData[projectionData.length - 1].age;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-semibold">Retirement Projection</h3>
            <p className="text-blue-100">Based on current investment strategy</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            ${(finalAmount / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-blue-100">
            Projected by age {targetAge}
          </div>
        </div>
      </div>

      <div className="h-[250px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectionData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="age" 
              tick={{ fill: '#fff' }}
              axisLine={{ stroke: '#fff' }}
              tickFormatter={(age) => age % 5 === 0 ? age : ''}
            />
            <YAxis 
              tick={{ fill: '#fff' }}
              axisLine={{ stroke: '#fff' }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `$${(value / 1000000).toFixed(1)}M`,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
              labelFormatter={(age) => `Age ${age}`}
              contentStyle={{ backgroundColor: '#fff', color: '#000' }}
            />
            <Bar 
              dataKey="breakdown.crypto" 
              stackId="a"
              fill="#10B981" 
              name="Crypto"
            />
            <Bar 
              dataKey="breakdown.investment" 
              stackId="a"
              fill="#60A5FA" 
              name="Investment"
            />
            <Bar 
              dataKey="breakdown.retirement" 
              stackId="a"
              fill="#818CF8" 
              name="Retirement"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        {[10, 20, 25, 29].map((yearIndex) => {
          const point = projectionData[yearIndex];
          return (
            <div key={point.age} className="text-center">
              <div className="text-sm text-blue-100">Age {point.age}</div>
              <div className="text-lg font-bold">${point.label}M</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calculateProjectionPoints(
  currentAge: number, 
  currentBalances: { retirement: number; investment: number; crypto: number; }
): ProjectionPoint[] {
  const projectionYears = 30;
  const data: ProjectionPoint[] = [];
  
  // Growth rates for different investment types
  const rates = {
    retirement: 0.08, // 8% annual return
    investment: 0.10, // 10% annual return
    crypto: 0.15,    // 15% annual return (higher risk/reward)
  };
  
  // Monthly contributions
  const contributions = {
    retirement: 4000,  // Combined 401k contributions
    investment: 2000,  // Regular investment contributions
    crypto: 500,       // Crypto DCA strategy
  };

  for (let year = 0; year <= projectionYears; year++) {
    const breakdown = {
      retirement: calculateFutureValue(currentBalances.retirement, contributions.retirement * 12, rates.retirement, year),
      investment: calculateFutureValue(currentBalances.investment, contributions.investment * 12, rates.investment, year),
      crypto: calculateFutureValue(currentBalances.crypto, contributions.crypto * 12, rates.crypto, year),
    };

    const totalAmount = breakdown.retirement + breakdown.investment + breakdown.crypto;

    data.push({
      age: currentAge + year,
      amount: totalAmount,
      label: (totalAmount / 1000000).toFixed(1),
      breakdown,
    });
  }

  return data;
}

function calculateFutureValue(
  principal: number,
  annualContribution: number,
  annualReturn: number,
  years: number
): number {
  return principal * Math.pow(1 + annualReturn, years) +
    annualContribution * ((Math.pow(1 + annualReturn, years) - 1) / annualReturn);
}