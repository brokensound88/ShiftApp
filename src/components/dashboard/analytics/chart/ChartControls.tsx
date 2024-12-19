import React from 'react';
import { BarChart2, LineChart, TrendingUp } from 'lucide-react';
import { ChartType, TimeRange, chartTypes, timeRanges } from './types';

interface ChartControlsProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
}

const chartIcons = {
  area: TrendingUp,
  line: LineChart,
  bar: BarChart2,
};

export function ChartControls({
  timeRange,
  setTimeRange,
  chartType,
  setChartType,
}: ChartControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {chartTypes.map(({ type, label }) => {
          const Icon = chartIcons[type];
          return (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`p-2 rounded-lg transition-colors ${
                chartType === type
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <div className="h-6 w-px bg-gray-200" />

      <div className="flex gap-1">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}