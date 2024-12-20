import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

interface StatCardProps {
  value: string;
  label: string;
  vision?: string;
  image?: string;
}

export function StatCard({ value, label, vision, image }: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div 
        className="p-8 bg-white rounded-2xl border border-cream-200 cursor-pointer transition-all duration-300 hover:border-blue-600"
        onClick={() => setIsExpanded(true)}
      >
        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="text-gray-600">{label}</div>
        <div className="mt-4 text-blue-600 flex items-center gap-2 text-sm">
          Learn More <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {image && (
                <div className="h-48 overflow-hidden rounded-t-2xl">
                  <img 
                    src={image} 
                    alt={label} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
                <div className="text-xl text-gray-600">{label}</div>
              </div>
              
              <div className="prose prose-lg">
                <p>{vision}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}