interface RetirementProjection {
  currentAge: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturn: number;
}

export function calculateRetirementProjection({
  currentAge,
  currentSavings,
  monthlyContribution,
  expectedReturn
}: RetirementProjection) {
  const yearsToGrow = 30;
  const annualContribution = monthlyContribution * 12;
  
  // Calculate future value using compound interest formula with monthly contributions
  const projectedAmount = currentSavings * Math.pow(1 + expectedReturn, yearsToGrow) +
    annualContribution * ((Math.pow(1 + expectedReturn, yearsToGrow) - 1) / expectedReturn);

  return {
    projectedAmount: Math.round(projectedAmount),
    retirementAge: currentAge + yearsToGrow
  };
}