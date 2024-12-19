import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Transaction } from '../../../types/customer';

interface PaymentStatsProps {
  transactions: Transaction[];
  dateRange: [Date, Date];
}

export function PaymentStats({ transactions, dateRange }: PaymentStatsProps) {
  const stats = useMemo(() => {
    const income = transactions
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = transactions
      .filter(tx => tx.type === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const netFlow = income - expenses;

    // Calculate average daily spending
    const days = Math.ceil((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24));
    const avgDaily = expenses / days;

    return { income, expenses, netFlow, avgDaily };
  }, [transactions, dateRange]);

  return (
    <div className="grid grid-cols-4 gap-6">
      <StatCard
        icon={<ArrowDownRight className="w-5 h-5 text-green-500" />}
        label="Total Income"
        value={stats.income}
        trend="+12.5%"
        positive
      />
      <StatCard
        icon={<ArrowUpRight className="w-5 h-5 text-red-500" />}
        label="Total Expenses"
        value={stats.expenses}
        trend="-3.2%"
        positive={false}
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        label="Net Flow"
        value={stats.netFlow}
        trend="+8.1%"
        positive
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
        label="Avg. Daily Spending"
        value={stats.avgDaily}
        trend="-5.4%"
        positive={false}
      />
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  positive 
}: { 
  icon: React.ReactNode;
  label: string;
  value: number;
  trend: string;
  positive: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">
          ${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      </div>
    </Card>
  );
}