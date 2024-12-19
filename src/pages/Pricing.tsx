import React from 'react';
import { Check } from 'lucide-react';
import { PricingCard } from '../components/pricing/PricingCard';

export function Pricing() {
  return (
    <div className="pt-32">
      <section className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for your business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Basic"
            price="Free"
            description="Perfect for individuals"
            features={[
              'P2P Payments',
              'Basic Analytics',
              'Connect 1 Wallet',
              'Email Support'
            ]}
          />
          <PricingCard
            title="Business"
            price="$49"
            description="For growing businesses"
            features={[
              'Everything in Basic',
              'Advanced Analytics',
              'Multiple Wallets',
              'Priority Support',
              'API Access'
            ]}
            highlighted
          />
          <PricingCard
            title="Enterprise"
            price="Custom"
            description="For large organizations"
            features={[
              'Everything in Business',
              'Custom Integration',
              'Dedicated Support',
              'SLA Guarantee',
              'Custom Features'
            ]}
          />
        </div>
      </section>
    </div>
  );
}