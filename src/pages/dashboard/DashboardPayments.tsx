import React, { useState, useMemo } from 'react';
import { Card } from '../../components/dashboard/ui/Card';
import { PaymentsList } from '../../components/dashboard/payments/PaymentsList';
import { PaymentFilters } from '../../components/dashboard/payments/PaymentFilters';
import { PaymentStats } from '../../components/dashboard/payments/PaymentStats';
import { useCustomerData } from '../../hooks/useCustomerData';
import { Transaction } from '../../types/customer';

export function DashboardPayments() {
  const { accounts } = useCustomerData();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(new Date().setMonth(new Date().getMonth() - 1)),
    new Date()
  ]);

  // Combine all transactions from all accounts
  const allTransactions = useMemo(() => {
    const transactions: Transaction[] = [];
    
    // Extract transactions from checking and savings accounts
    Object.values(accounts).forEach(account => {
      if ('transactions' in account) {
        transactions.push(...(account as any).transactions);
      }
    });

    return transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [accounts]);

  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const matchesDateRange = transactionDate >= dateRange[0] && transactionDate <= dateRange[1];
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(transaction.category);
      const matchesAccount = selectedAccounts.length === 0 || selectedAccounts.includes(transaction.id.split('-')[0]);
      
      return matchesDateRange && matchesCategory && matchesAccount;
    });
  }, [allTransactions, selectedCategories, selectedAccounts, dateRange]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments & Transactions</h1>

      <PaymentStats transactions={filteredTransactions} dateRange={dateRange} />

      <Card className="p-6">
        <PaymentFilters
          transactions={allTransactions}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedAccounts={selectedAccounts}
          setSelectedAccounts={setSelectedAccounts}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        <PaymentsList transactions={filteredTransactions} />
      </Card>
    </div>
  );
}