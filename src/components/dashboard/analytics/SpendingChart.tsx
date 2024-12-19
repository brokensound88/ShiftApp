import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

const data = [
  { date: 'Jan', amount: 4000 },
  { date: 'Feb', amount: 3000 },
  { date: 'Mar', amount: 5000 },
  { date: 'Apr', amount: 2780 },
  { date: 'May', amount: 1890 },
  { date: 'Jun', amount: 2390 },
];

export function SpendingChart() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Spending Patterns</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#2563eb" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}