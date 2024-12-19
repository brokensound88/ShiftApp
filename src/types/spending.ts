export interface MonthlyExpenses {
  housing: {
    mortgage: number;
    utilities: {
      electric: number;
      water: number;
      gas: number;
      internet: number;
      phone: number;
    };
    maintenance: {
      regular: number;
      seasonal: number;
    };
    insurance: {
      home: number;
      flood: number;
    };
  };
  transportation: {
    fuel: {
      primary: number;
      secondary: number;
    };
    maintenance: {
      regular: number;
      unexpected: number;
    };
    insurance: {
      primary: number;
      secondary: number;
    };
    parking: number;
    tolls: number;
  };
  food: {
    groceries: {
      regular: number;
      specialty: number;
    };
    diningOut: {
      restaurants: number;
      takeout: number;
      coffee: number;
    };
  };
  healthcare: {
    insurance: {
      medical: number;
      dental: number;
      vision: number;
    };
    medications: number;
    outOfPocket: number;
  };
  education: {
    studentLoans: {
      colin: number;
      debbie: number;
    };
    childrenActivities: {
      emma: {
        swimming: number;
        piano: number;
      };
      lucas: {
        soccer: number;
        artClass: number;
      };
    };
    supplies: number;
    tutoring: number;
  };
  entertainment: {
    streaming: {
      netflix: number;
      hulu: number;
      disney: number;
      spotify: number;
      amazonPrime: number;
    };
    hobbies: {
      colin: {
        golf: number;
        boating: number;
      };
      debbie: {
        yoga: number;
        painting: number;
      };
    };
    familyActivities: number;
  };
  savings: {
    emergency: number;
    retirement: {
      colin401k: number;
      debbie401k: number;
    };
    college: {
      emma: number;
      lucas: number;
    };
    vacation: number;
  };
  debt: {
    boatLoan: number;
    creditCards: number;
  };
}

export interface DiscretionarySpending {
  shopping: {
    clothing: {
      colin: number;
      debbie: number;
      emma: number;
      lucas: number;
    };
    electronics: number;
    homeDecor: number;
  };
  personalCare: {
    haircuts: {
      colin: number;
      debbie: number;
      emma: number;
      lucas: number;
    };
    spa: {
      debbie: number;
    };
    gym: {
      colin: number;
      debbie: number;
    };
  };
  gifts: {
    birthdays: number;
    holidays: number;
    special: number;
  };
  travel: {
    weekendTrips: number;
    vacationSavings: number;
  };
  charitable: {
    monthly: number;
    annual: number;
  };
}

export interface SeasonalExpenses {
  spring: {
    homeRepairs: number;
    lawnCare: number;
    sports: number;
    easter: number;
  };
  summer: {
    vacation: number;
    campActivities: number;
    boatMaintenance: number;
    poolMembership: number;
  };
  fall: {
    schoolSupplies: number;
    fallSports: number;
    halloween: number;
    thanksgiving: number;
  };
  winter: {
    christmas: number;
    winterActivities: number;
    heating: number;
    holidayTravel: number;
  };
}