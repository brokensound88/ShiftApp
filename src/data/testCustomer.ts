import { CustomerProfile } from '../types/customer';

export const testCustomer: CustomerProfile = {
  id: 'test-001',
  personalInfo: {
    firstName: 'Colin',
    lastName: 'Mitchell',
    age: 36,
    spouse: {
      firstName: 'Debbie',
      lastName: 'Mitchell',
      age: 34,
      occupation: 'Dental Assistant',
      income: 250000,
      workSchedule: '25 hours/week',
    },
    children: [
      { name: 'Emma', age: 7 },
      { name: 'Lucas', age: 4 }
    ],
    occupation: 'Senior Product Manager',
    employer: 'TechCorp Industries',
    income: {
      base: 220000,
      bonus: 89000,
      stock: 80000,
      total: 389000
    },
    location: {
      city: 'Franklin',
      state: 'Tennessee',
      type: 'Suburban'
    }
  },
  accounts: {
    checking: {
      id: 'chk-001',
      type: 'Checking',
      balance: 44000,
      institution: 'First Horizon Bank',
      accountNumber: '****4567',
    },
    savings: {
      id: 'sav-001',
      type: 'Savings',
      balance: 14000, // Emergency Fund
      institution: 'First Horizon Bank',
      accountNumber: '****7890',
      apy: 4.5,
      subAccounts: [
        { name: 'Holiday Fund', balance: 11000, target: 15000 },
        { name: 'Emergency Fund', balance: 14000, target: 25000 }
      ]
    },
    retirement: {
      id: '401k-001',
      type: '401k',
      accounts: [
        {
          owner: 'Colin',
          balance: 300000,
          institution: 'Fidelity',
          allocation: {
            stocks: 75,
            bonds: 20,
            cash: 5,
          },
          yearToDateReturn: 12.5,
          employerMatch: 6,
        },
        {
          owner: 'Debbie',
          balance: 187000,
          institution: 'Vanguard',
          allocation: {
            stocks: 80,
            bonds: 15,
            cash: 5,
          },
          yearToDateReturn: 11.8,
          employerMatch: 4,
        }
      ]
    },
    properties: {
      primary: {
        type: 'Primary Residence',
        value: 770000,
        mortgage: {
          balance: 180000,
          rate: 3.25,
          payment: 2450,
          yearsRemaining: 19
        },
        address: '1234 Maple Drive, Franklin, TN 37064',
        yearPurchased: 2019,
        insurance: {
          provider: 'State Farm',
          premium: 2200,
          coverage: 800000
        }
      },
      vacation: {
        type: 'Vacation Home',
        value: 300000,
        paid: true,
        address: '789 Lake View Rd, Winchester, TN 37398',
        yearPurchased: 2022,
        insurance: null, // No flood insurance
        risks: ['Flood zone', 'No insurance coverage']
      }
    },
    loans: {
      boat: {
        type: 'Boat Loan',
        balance: 50000,
        rate: 6.5,
        payment: 920,
        lender: 'Marine Finance Co'
      },
      student: {
        type: 'Student Loans',
        total: 27000,
        loans: [
          {
            owner: 'Colin',
            balance: 18000,
            rate: 4.5,
            payment: 320
          },
          {
            owner: 'Debbie',
            balance: 9000,
            rate: 3.8,
            payment: 180
          }
        ]
      }
    },
    investment: {
      id: 'inv-001',
      type: 'Brokerage',
      balance: 185000,
      institution: 'Charles Schwab',
      positions: [
        { symbol: 'AAPL', shares: 150, value: 28500, basis: 22000 },
        { symbol: 'GOOGL', shares: 45, value: 62100, basis: 48000 },
        { symbol: 'VTI', shares: 380, value: 84400, basis: 65000 },
        { symbol: 'MSFT', shares: 85, value: 32300, basis: 25000 }
      ]
    }
  },
  monthlyBudget: {
    income: {
      salary: 32416, // Combined monthly
      rentalIncome: 0,
      investments: 1200,
      total: 33616
    },
    expenses: {
      housing: {
        mortgage: 2450,
        utilities: 380,
        maintenance: 400
      },
      transportation: {
        fuel: 450,
        maintenance: 200,
        insurance: 180
      },
      food: {
        groceries: 1200,
        diningOut: 800
      },
      healthcare: {
        insurance: 600,
        medications: 100,
        dental: 80
      },
      education: {
        studentLoans: 500,
        childrenActivities: 400,
        supplies: 150
      },
      entertainment: {
        streaming: 85,
        hobbies: 300,
        vacation: 1000
      },
      savings: {
        emergency: 1000,
        retirement: 4000,
        college: 1000
      },
      debt: {
        boatLoan: 920,
        creditCards: 0
      }
    }
  },
  goals: {
    retirement: {
      target: 4000000,
      current: 487000,
      monthlyContribution: 4000,
      projectedAge: 60
    },
    education: {
      target: 400000,
      current: 85000,
      monthlyContribution: 1000,
      breakdown: [
        { child: 'Emma', target: 200000, current: 50000 },
        { child: 'Lucas', target: 200000, current: 35000 }
      ]
    },
    emergency: {
      target: 25000,
      current: 14000
    },
    vacation: {
      target: 15000,
      current: 11000,
      targetDate: '2024-12-31'
    }
  },
  risks: [
    {
      type: 'Property',
      severity: 'High',
      description: 'Vacation home in flood zone without insurance'
    },
    {
      type: 'Investment',
      severity: 'Medium',
      description: 'High concentration in technology sector'
    },
    {
      type: 'Income',
      severity: 'Low',
      description: 'Significant portion of compensation in stock'
    }
  ]
};