import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { Transaction } from '../../../types/customer';

interface PaymentFiltersProps {
  transactions: Transaction[];
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedAccounts: string[];
  setSelectedAccounts: (accounts: string[]) => void;
  dateRange: [Date, Date];
  setDateRange: (range: [Date, Date]) => void;
}

export function PaymentFilters({
  transactions,
  selectedCategories,
  setSelectedCategories,
  selectedAccounts,
  setSelectedAccounts,
  dateRange,
  setDateRange
}: PaymentFiltersProps) {
  // Get unique categories and accounts
  const categories = [...new Set(transactions.map(tx => tx.category))].sort();
  const accounts = [...new Set(transactions.map(tx => tx.id.split('-')[0]))].sort();

  const handleDateRangeChange = (period: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    setDateRange([start, end]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={`${Math.round((dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24))}`}
            onChange={(e) => handleDateRangeChange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  if (selectedCategories.includes(category)) {
                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                  } else {
                    setSelectedCategories([...selectedCategories, category]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategories.includes(category)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Accounts</h4>
          <div className="flex flex-wrap gap-2">
            {accounts.map(account => (
              <button
                key={account}
                onClick={() => {
                  if (selectedAccounts.includes(account)) {
                    setSelectedAccounts(selectedAccounts.filter(a => a !== account));
                  } else {
                    setSelectedAccounts([...selectedAccounts, account]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedAccounts.includes(account)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {account}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}