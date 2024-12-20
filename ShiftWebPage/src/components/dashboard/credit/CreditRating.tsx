import React, { useState } from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { CreditOffers } from './CreditOffers';
import { useCreditScore } from '../../../hooks/useCreditScore';

export function CreditRating() {
  const [showOffers, setShowOffers] = useState(false);
  const { score, rating, lastUpdated } = useCreditScore();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Credit Score</h3>
            <p className="text-sm text-gray-600">Last updated {lastUpdated}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{score}</div>
          <div className="text-sm font-medium text-green-600">{rating}</div>
        </div>
      </div>

      <button
        onClick={() => setShowOffers(true)}
        className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">View Personalized Offers</span>
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>

      <CreditOffers isOpen={showOffers} onClose={() => setShowOffers(false)} />
    </Card>
  );
}