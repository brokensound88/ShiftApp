import React from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { SpendingChart } from '../components/dashboard/analytics/SpendingChart';
import { SavingsGoals } from '../components/dashboard/analytics/SavingsGoals';
import { AIInsights } from '../components/dashboard/analytics/AIInsights';

export function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">AI Financial Assistant</h1>
        <div className="grid grid-cols-2 gap-6">
          <SpendingChart />
          <SavingsGoals />
        </div>
        <AIInsights />
      </div>
    </DashboardLayout>
  );
}