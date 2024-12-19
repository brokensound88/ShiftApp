import React, { createContext, useEffect, useState } from 'react';
import { CustomerProfile } from '../types/customer';
import { testCustomer } from '../data/testCustomer';
import { bankAccounts } from '../data/accounts/banking';
import { investmentAccounts } from '../data/accounts/investments';

interface CustomerContextType {
  profile: CustomerProfile;
  accounts: CustomerProfile['accounts'];
  goals: CustomerProfile['goals'];
  refreshData: () => Promise<void>;
}

export const CustomerContext = createContext<CustomerContextType | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customerData, setCustomerData] = useState<CustomerProfile>({
    ...testCustomer,
    accounts: {
      ...testCustomer.accounts,
      checking: bankAccounts.find(acc => acc.id === 'chk-gs-001'),
      savings: bankAccounts.find(acc => acc.id === 'sav-gs-001'),
      investment: {
        ...testCustomer.accounts.investment,
        ...investmentAccounts[0],
        positions: [
          ...investmentAccounts[0].positions,
          ...investmentAccounts[1].positions
        ]
      }
    }
  });

  const refreshData = async () => {
    // In a real app, this would fetch from an API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCustomerData(current => ({ ...current }));
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <CustomerContext.Provider
      value={{
        profile: customerData,
        accounts: customerData.accounts,
        goals: customerData.goals,
        refreshData,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}