import { useMemo } from 'react';
import { monthlyExpenses } from '../data/spending/monthlyExpenses';
import { discretionarySpending } from '../data/spending/discretionarySpending';
import { seasonalExpenses } from '../data/spending/seasonalExpenses';

export function useSpendingAnalytics() {
  const analytics = useMemo(() => {
    // Calculate total monthly expenses
    const totalMonthly = calculateTotalMonthly();
    
    // Calculate total annual expenses including seasonal
    const totalAnnual = (totalMonthly * 12) + calculateTotalSeasonal();
    
    // Calculate savings rate
    const totalIncome = 389000 + 250000; // Combined annual income
    const savingsRate = ((totalIncome - totalAnnual) / totalIncome) * 100;
    
    // Calculate expense ratios
    const expenseRatios = calculateExpenseRatios(totalAnnual);
    
    return {
      monthly: totalMonthly,
      annual: totalAnnual,
      savingsRate,
      expenseRatios,
      breakdown: {
        monthly: monthlyExpenses,
        discretionary: discretionarySpending,
        seasonal: seasonalExpenses
      }
    };
  }, []);

  return analytics;
}

function calculateTotalMonthly(): number {
  // Recursively sum all numeric values in the monthly expenses object
  const sum = (obj: any): number => {
    return Object.values(obj).reduce((acc: number, val) => {
      if (typeof val === 'number') return acc + val;
      if (typeof val === 'object') return acc + sum(val);
      return acc;
    }, 0);
  };

  return sum(monthlyExpenses) + sum(discretionarySpending);
}

function calculateTotalSeasonal(): number {
  return Object.values(seasonalExpenses).reduce((acc, season) => {
    return acc + Object.values(season).reduce((sum, value) => sum + value, 0);
  }, 0);
}

function calculateExpenseRatios(totalAnnual: number) {
  return {
    housing: (sumCategory(monthlyExpenses.housing) * 12) / totalAnnual,
    transportation: (sumCategory(monthlyExpenses.transportation) * 12) / totalAnnual,
    food: (sumCategory(monthlyExpenses.food) * 12) / totalAnnual,
    healthcare: (sumCategory(monthlyExpenses.healthcare) * 12) / totalAnnual,
    education: (sumCategory(monthlyExpenses.education) * 12) / totalAnnual,
    entertainment: (sumCategory(monthlyExpenses.entertainment) * 12) / totalAnnual,
    savings: (sumCategory(monthlyExpenses.savings) * 12) / totalAnnual,
    debt: (sumCategory(monthlyExpenses.debt) * 12) / totalAnnual
  };
}

function sumCategory(category: any): number {
  if (typeof category === 'number') return category;
  return Object.values(category).reduce((acc: number, val) => {
    if (typeof val === 'number') return acc + val;
    return acc + sumCategory(val);
  }, 0);
}