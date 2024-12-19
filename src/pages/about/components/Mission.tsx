import React from 'react';
import { Target } from 'lucide-react';

export function Mission() {
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center bg-blue-100 rounded-full">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl text-gray-700 leading-relaxed">
            To democratize global finance by creating a decentralized payment infrastructure that enables instant, secure, and nearly free transactions for everyone, everywhere.
          </p>
        </div>
      </div>
    </div>
  );
}