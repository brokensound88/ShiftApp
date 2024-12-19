import React from 'react';
import { X, CreditCard, Briefcase } from 'lucide-react';
import { useCustomerData } from '../../../hooks/useCustomerData';

interface CreditOffersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditOffers({ isOpen, onClose }: CreditOffersProps) {
  const { profile } = useCustomerData();
  const income = profile.personalInfo.income.total;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Personalized Offers</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Credit Cards</h3>
            <div className="grid gap-4">
              <OfferCard
                icon={<CreditCard className="w-6 h-6" />}
                title="Premium Rewards Card"
                description="6% cash back on travel, 4% on dining"
                details={[
                  '$800 welcome bonus',
                  'No foreign transaction fees',
                  '$295 annual fee'
                ]}
                apr="16.99% - 24.99%"
                limit={Math.min(income * 0.3, 50000)}
              />
              <OfferCard
                icon={<CreditCard className="w-6 h-6" />}
                title="Cash Back Plus"
                description="3% on all purchases"
                details={[
                  '$300 welcome bonus',
                  'No annual fee',
                  'Cell phone protection'
                ]}
                apr="14.99% - 22.99%"
                limit={Math.min(income * 0.2, 30000)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Loans</h3>
            <div className="grid gap-4">
              <OfferCard
                icon={<Briefcase className="w-6 h-6" />}
                title="Home Improvement Loan"
                description="Low-rate financing for renovations"
                details={[
                  'Borrow up to $100,000',
                  'No prepayment penalties',
                  'Fixed monthly payments'
                ]}
                apr="5.99% - 12.99%"
                limit={Math.min(income * 0.5, 100000)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferCard({ 
  icon, 
  title, 
  description, 
  details, 
  apr, 
  limit 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  apr: string;
  limit: number;
}) {
  return (
    <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-500 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-1">{title}</h4>
          <p className="text-gray-600 mb-4">{description}</p>
          <ul className="space-y-2 mb-4">
            {details.map((detail, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-600 rounded-full" />
                {detail}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">APR: <span className="font-medium">{apr}</span></span>
            <span className="text-gray-600">Up to <span className="font-medium">${limit.toLocaleString()}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}