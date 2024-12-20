import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction } from '../../../types/customer';

interface PaymentsListProps {
  transactions: Transaction[];
}

export function PaymentsList({ transactions }: PaymentsListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found for the selected filters.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div 
            key={tx.id} 
            className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-4">
              {tx.type === 'debit' ? (
                <ArrowUpRight className="w-5 h-5 text-red-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium">{tx.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">
                    {new Date(tx.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="text-gray-600 capitalize">{tx.category}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium ${tx.type === 'debit' ? 'text-red-500' : 'text-green-500'}`}>
                {tx.type === 'debit' ? '-' : '+'}${tx.amount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                {tx.id.split('-')[0]} Account
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}