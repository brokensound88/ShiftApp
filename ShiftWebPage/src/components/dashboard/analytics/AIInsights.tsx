import React from 'react';
import { TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card } from '../ui/Card';

const insights = [
  {
    type: 'opportunity',
    icon: <TrendingUp className="w-5 h-5 text-green-500" />,
    title: 'Investment Opportunity',
    description: 'Based on your spending patterns, you could invest an additional $200/month',
  },
  {
    type: 'alert',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    title: 'Unusual Activity',
    description: 'Subscription spending increased by 45% this month',
  },
  {
    type: 'tip',
    icon: <Lightbulb className="w-5 h-5 text-blue-500" />,
    title: 'Smart Tip',
    description: 'Consolidating your streaming services could save you $25/month',
  },
];

export function AIInsights() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            {insight.icon}
            <div>
              <h4 className="font-medium mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}