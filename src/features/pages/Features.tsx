import React from 'react';
import { features } from '../data/features';
import { FeatureCard } from '../../components/shared/FeatureCard';
import * as Icons from 'lucide-react';

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
          {Object.values(features).map((feature) => {
            const Icon = Icons[feature.icon as keyof typeof Icons];
            return (
              <FeatureCard
                key={feature.id}
                icon={<Icon className="w-8 h-8" />}
                title={feature.title}
                description={feature.description}
                slug={feature.id}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}