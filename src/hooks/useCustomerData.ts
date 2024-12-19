import { useContext } from 'react';
import { CustomerContext } from '../context/CustomerContext';

export function useCustomerData() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerData must be used within a CustomerProvider');
  }
  return context;
}