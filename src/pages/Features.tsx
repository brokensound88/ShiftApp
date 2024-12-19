import React from 'react';
import { Zap, Lock, Globe2, Coins, BarChart, Wallet } from 'lucide-react';
import { FeatureCard } from '../components/shared/FeatureCard';

export function Features() {
  return (
    <div className="pt-32">
      <section className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">Platform Features</h1>
          <p className="text-xl text-gray-600">
            Everything you need to process payments globally with blockchain technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-blue-600" />}
            title="Microtransactions"
            description="Process payments as low as $0.01 with near-zero fees"
          />
          <FeatureCard
            icon={<Lock className="w-8 h-8 text-blue-600" />}
            title="Smart Contracts"
            description="Automated, secure, and transparent transactions"
          />
          <FeatureCard
            icon={<Globe2 className="w-8 h-8 text-blue-600" />}
            title="Global Reach"
            description="Send payments anywhere instantly"
          />
          <FeatureCard
            icon={<Coins className="w-8 h-8 text-blue-600" />}
            title="Multi-Currency"
            description="Support for major cryptocurrencies and fiat"
          />
          <FeatureCard
            icon={<BarChart className="w-8 h-8 text-blue-600" />}
            title="Analytics"
            description="Real-time tracking and reporting"
          />
          <FeatureCard
            icon={<Wallet className="w-8 h-8 text-blue-600" />}
            title="Wallet Integration"
            description="Connect with popular crypto wallets"
          />
        </div>
      </section>
    </div>
  );
}