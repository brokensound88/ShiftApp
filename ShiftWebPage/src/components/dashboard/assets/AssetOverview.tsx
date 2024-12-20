import React from 'react';
import { Home, Car, Wallet, Bitcoin } from 'lucide-react';
import { Card } from '../ui/Card';
import { useCustomerData } from '../../../hooks/useCustomerData';
import { RetirementProjection } from './RetirementProjection';

export function AssetOverview() {
  const { accounts } = useCustomerData();
  const { properties, investment } = accounts;

  const assets = [
    {
      icon: <Home className="w-6 h-6" />,
      name: "Primary Residence",
      value: properties?.primary.value || 0,
      change: "+5.2% YTD",
      positive: true,
      details: properties?.primary.address
    },
    {
      icon: <Home className="w-6 h-6" />,
      name: "Vacation Home",
      value: properties?.vacation?.value || 0,
      change: "+3.8% YTD",
      positive: true,
      details: properties?.vacation?.address
    },
    {
      icon: <Car className="w-6 h-6" />,
      name: "Vehicles",
      value: 85000,
      change: "-12% YTD",
      positive: false,
      details: "2023 Tesla Model Y, 2022 BMW X5"
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      name: "Investment Portfolio",
      value: investment?.balance || 0,
      change: "+12.5% YTD",
      positive: true,
      details: `${investment?.positions.length || 0} positions`
    },
    {
      icon: <Bitcoin className="w-6 h-6" />,
      name: "Cryptocurrency",
      value: 300000,
      change: "+150% YTD",
      positive: true,
      details: "8.5 BTC, 45 ETH"
    }
  ];

  return (
    <div className="space-y-6">
      <RetirementProjection />

      <div className="grid grid-cols-2 gap-4">
        {assets.map((asset) => (
          <Card key={asset.name} className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                {asset.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{asset.name}</h3>
                  <span className={`text-sm font-medium ${
                    asset.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {asset.change}
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1">
                  ${asset.value.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">{asset.details}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}