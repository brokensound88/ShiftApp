import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function DashboardOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Balance"
          value="$2,459.50"
          trend="+15%"
          positive
        />
        <DashboardCard
          title="Transactions"
          value="156"
          trend="+23%"
          positive
        />
        <DashboardCard
          title="Fees Saved"
          value="$892.40"
          trend="+8%"
          positive
        />
      </div>

      <div className="bg-white rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          <TransactionRow
            description="Payment to John Doe"
            amount="-$250.00"
            date="Today, 2:30 PM"
            negative
          />
          <TransactionRow
            description="Received from Alice Smith"
            amount="+$1,000.00"
            date="Yesterday, 4:15 PM"
            positive
          />
          <TransactionRow
            description="Payment to Coffee Shop"
            amount="-$4.50"
            date="Mar 15, 9:30 AM"
            negative
          />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, trend, positive }: { title: string; value: string; trend: string; positive: boolean }) {
  return (
    <div className="bg-white rounded-xl p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <span className={`flex items-center text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trend}
        </span>
      </div>
    </div>
  );
}

function TransactionRow({ description, amount, date, positive }: { description: string; amount: string; date: string; positive: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium">{description}</p>
        <p className="text-sm text-gray-500">{date}</p>
      </div>
      <span className={positive ? 'text-green-600' : 'text-red-600'}>
        {amount}
      </span>
    </div>
  );
}