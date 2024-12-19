import React, { useEffect } from 'react';
import { 
  AreaChart, Area, 
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { ChartType, TimeRange } from './types';
import { useStockData } from '../../../../hooks/useStockData';
import { useCustomerData } from '../../../../hooks/useCustomerData';

interface StockChartProps {
  timeRange: TimeRange;
  chartType: ChartType;
  selectedStock: string | null;
}

export function StockChart({ timeRange, chartType, selectedStock }: StockChartProps) {
  const { stocks, fetchStockData } = useStockData();
  const { accounts } = useCustomerData();
  const positions = accounts.investment?.positions || [];

  useEffect(() => {
    if (selectedStock) {
      fetchStockData(selectedStock, timeRange);
    } else {
      // Load all stocks in portfolio
      positions.forEach(position => {
        fetchStockData(position.symbol, timeRange);
      });
    }
  }, [selectedStock, timeRange, positions]);

  const data = selectedStock 
    ? stocks[selectedStock]?.data || []
    : positions.reduce((acc, position) => {
        const stockData = stocks[position.symbol]?.data || [];
        if (acc.length === 0) return stockData;
        return acc.map((point, i) => ({
          date: point.date,
          value: point.value + (stockData[i]?.value || 0),
        }));
      }, [] as { date: string; value: number; }[]);

  const commonProps = {
    width: "100%",
    height: "100%",
    data,
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
  };

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, selectedStock || 'Portfolio']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              fill="#2563eb" 
              fillOpacity={0.3} 
            />
          </AreaChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, selectedStock || 'Portfolio']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, selectedStock || 'Portfolio']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Bar 
              dataKey="value" 
              fill="#2563eb" 
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="h-[400px]">
      <ResponsiveContainer>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}