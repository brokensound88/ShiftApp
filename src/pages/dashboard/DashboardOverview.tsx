import React from 'react';
import { useCustomerData } from '../../hooks/useCustomerData';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { AssetOverview } from '../../components/dashboard/assets/AssetOverview';
import { MarketChart } from '../../components/dashboard/analytics/MarketChart';
import { StockHoldings } from '../../components/dashboard/analytics/StockHoldings';
import { SavingsGoals } from '../../components/dashboard/analytics/SavingsGoals';
import { AIInsights } from '../../components/dashboard/analytics/AIInsights';
import { RealTimeStocks } from '../../components/dashboard/analytics/RealTimeStocks';
import { PortfolioOverview } from '../../components/dashboard/analytics/PortfolioOverview';
import { CreditRating } from '../../components/dashboard/credit/CreditRating';

export function DashboardOverview() {
  const { profile } = useCustomerData();
  const totalAssets = calculateTotalAssets(profile);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Overview</h2>
          <p className="text-gray-600">Total Assets: ${totalAssets.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <QuickActions />
        </div>
        <CreditRating />
      </div>

      <AssetOverview />
      
      <MarketChart />
      
      <div className="grid grid-cols-2 gap-6">
        <StockHoldings />
        <div className="space-y-6">
          <RealTimeStocks />
          <SavingsGoals />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <PortfolioOverview />
        <AIInsights />
      </div>
    </div>
  );
}

function calculateTotalAssets(profile: any) {
  const { accounts } = profile;
  return (
    (accounts.checking?.balance || 0) +
    (accounts.savings?.balance || 0) +
    (accounts.investment?.balance || 0) +
    (accounts.retirement?.accounts.reduce((sum: number, account: any) => sum + account.balance, 0) || 0) +
    (accounts.properties?.primary?.value || 0) +
    (accounts.properties?.vacation?.value || 0) +
    300000 // Bitcoin holdings
  );
}