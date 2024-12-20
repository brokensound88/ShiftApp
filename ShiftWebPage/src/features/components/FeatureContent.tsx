import React from 'react';
import { Feature } from '../types';

interface FeatureContentProps {
  feature: Feature;
}

export function FeatureContent({ feature }: FeatureContentProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-lg text-gray-700">{feature.content.overview}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Key Benefits</h2>
        <ul className="space-y-3">
          {feature.content.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-blue-600">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Technical Details</h2>
        <ul className="space-y-3">
          {feature.content.details.map((detail, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-blue-600">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}