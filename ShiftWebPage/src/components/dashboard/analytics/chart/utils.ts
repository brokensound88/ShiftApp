import { TimeRange } from './types';

interface DataPoint {
  date: string;
  value: number;
}

export function generateChartData(timeRange: TimeRange): DataPoint[] {
  const data: DataPoint[] = [];
  const now = new Date();
  let days: number;

  switch (timeRange) {
    case '1D':
      days = 1;
      break;
    case '1W':
      days = 7;
      break;
    case '1M':
      days = 30;
      break;
    case '3M':
      days = 90;
      break;
    case '1Y':
      days = 365;
      break;
    case 'ALL':
      days = 1825; // 5 years
      break;
  }

  let value = 100;
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some random variation
    value = value * (1 + (Math.random() * 0.06 - 0.03));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Number(value.toFixed(2)),
    });
  }

  return data;
}