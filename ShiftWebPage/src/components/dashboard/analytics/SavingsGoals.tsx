import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Card } from '../ui/Card';
import 'react-circular-progressbar/dist/styles.css';

interface Goal {
  name: string;
  current: number;
  target: number;
  color: string;
}

const goals: Goal[] = [
  { name: 'Retirement', current: 45000, target: 100000, color: '#2563eb' },
  { name: 'Emergency Fund', current: 8000, target: 10000, color: '#16a34a' },
  { name: 'Vacation', current: 2000, target: 5000, color: '#9333ea' },
];

export function SavingsGoals() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Savings Goals</h3>
      <div className="grid grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.name} className="text-center">
            <div className="w-24 h-24 mx-auto mb-4">
              <CircularProgressbar
                value={(goal.current / goal.target) * 100}
                text={`${Math.round((goal.current / goal.target) * 100)}%`}
                styles={buildStyles({
                  pathColor: goal.color,
                  textColor: goal.color,
                })}
              />
            </div>
            <h4 className="font-medium mb-1">{goal.name}</h4>
            <p className="text-sm text-gray-600">
              ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}