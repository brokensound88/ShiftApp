export type ChartType = 'area' | 'line' | 'bar';
export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export const chartTypes = [
  { type: 'area', label: 'Area' },
  { type: 'line', label: 'Line' },
  { type: 'bar', label: 'Bar' }
] as const;

export const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];