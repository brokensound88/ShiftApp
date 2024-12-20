import { useState, useEffect } from 'react';
import { useCustomerData } from './useCustomerData';

interface CreditScore {
  score: number;
  rating: string;
  lastUpdated: string;
}

export function useCreditScore() {
  const [creditData, setCreditData] = useState<CreditScore>({
    score: 815,
    rating: 'Exceptional',
    lastUpdated: 'Mar 15, 2024'
  });

  const { profile } = useCustomerData();

  useEffect(() => {
    // Simulate API call to credit bureau
    // In reality, this would fetch real-time data
    const fetchCreditScore = async () => {
      // Simulated positive factors:
      // - High income
      // - Low debt-to-income ratio
      // - Long credit history
      // - No missed payments
      const baseScore = 815;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCreditData({
        score: baseScore,
        rating: 'Exceptional',
        lastUpdated: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      });
    };

    fetchCreditScore();
  }, [profile.id]);

  return creditData;
}