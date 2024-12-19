import { MonthlyExpenses } from '../../types/spending';

export const monthlyExpenses: MonthlyExpenses = {
  housing: {
    mortgage: 2450,
    utilities: {
      electric: 180,
      water: 80,
      gas: 120,
      internet: 89,
      phone: 160
    },
    maintenance: {
      regular: 200,
      seasonal: 200
    },
    insurance: {
      home: 183,
      flood: 0 // No flood insurance on vacation home
    }
  },
  transportation: {
    fuel: {
      primary: 280,
      secondary: 170
    },
    maintenance: {
      regular: 150,
      unexpected: 50
    },
    insurance: {
      primary: 110,
      secondary: 70
    },
    parking: 60,
    tolls: 40
  },
  food: {
    groceries: {
      regular: 950,
      specialty: 250
    },
    diningOut: {
      restaurants: 600,
      takeout: 200,
      coffee: 120
    }
  },
  healthcare: {
    insurance: {
      medical: 400,
      dental: 120,
      vision: 80
    },
    medications: 100,
    outOfPocket: 150
  },
  education: {
    studentLoans: {
      colin: 320,
      debbie: 180
    },
    childrenActivities: {
      emma: {
        swimming: 120,
        piano: 160
      },
      lucas: {
        soccer: 90,
        artClass: 80
      }
    },
    supplies: 150,
    tutoring: 200
  },
  entertainment: {
    streaming: {
      netflix: 20,
      hulu: 15,
      disney: 15,
      spotify: 15,
      amazonPrime: 15
    },
    hobbies: {
      colin: {
        golf: 200,
        boating: 150
      },
      debbie: {
        yoga: 120,
        painting: 100
      }
    },
    familyActivities: 400
  },
  savings: {
    emergency: 1000,
    retirement: {
      colin401k: 2750,
      debbie401k: 1250
    },
    college: {
      emma: 500,
      lucas: 500
    },
    vacation: 1000
  },
  debt: {
    boatLoan: 920,
    creditCards: 0 // They pay in full each month
  }
};