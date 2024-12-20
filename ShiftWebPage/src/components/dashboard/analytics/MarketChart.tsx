import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ChartControls } from './chart/ChartControls';
import { StockChart } from './chart/StockChart';
import { useStockSelection } from '../../../hooks/useStockSelection';
import { ChartType, TimeRange } from './chart/types';

export function MarketChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [chartType, setChartType] = useState<ChartType>('area');
  const { selectedStock } = useStockSelection();

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            {selectedStock ? `${selectedStock} Performance` : 'Portfolio Performance'}
          </h3>
          <p className="text-sm text-gray-600">
            {timeRange === '1D' ? 'Today' : 
             timeRange === '1W' ? 'Past Week' :
             timeRange === '1M' ? 'Past Month' :
             timeRange === '3M' ? 'Past 3 Months' :
             timeRange === '1Y' ? 'Past Year' : 'All Time'}
          </p>
        </div>
        <ChartControls
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          chartType={chartType}
          setChartType={setChartType}
        />
      </div>
      <StockChart
        timeRange={timeRange}
        chartType={chartType}
        selectedStock={selectedStock}
      />
    </Card>
  );
}