import React from 'react';
import { Check } from 'lucide-react';

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export function PricingCard({ title, price, description, features, highlighted = false }: PricingCardProps) {
  return (
    <div className={`p-8 rounded-2xl ${
      highlighted 
        ? 'bg-blue-600 text-white shadow-lg scale-105' 
        : 'bg-white border border-gray-100'
    }`}>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">{price}</span>
        {price !== 'Custom' && <span className="text-sm">/month</span>}
      </div>
      <p className={`mb-6 ${highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
        {description}
      </p>
      <ul className="space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}