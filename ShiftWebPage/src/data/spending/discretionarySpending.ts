import { DiscretionarySpending } from '../../types/spending';

export const discretionarySpending: DiscretionarySpending = {
  shopping: {
    clothing: {
      colin: 200,
      debbie: 300,
      emma: 150,
      lucas: 150
    },
    electronics: 200,
    homeDecor: 250
  },
  personalCare: {
    haircuts: {
      colin: 40,
      debbie: 120,
      emma: 30,
      lucas: 25
    },
    spa: {
      debbie: 150
    },
    gym: {
      colin: 80,
      debbie: 80
    }
  },
  gifts: {
    birthdays: 200,
    holidays: 400,
    special: 150
  },
  travel: {
    weekendTrips: 600,
    vacationSavings: 1000
  },
  charitable: {
    monthly: 500,
    annual: 2000
  }
};