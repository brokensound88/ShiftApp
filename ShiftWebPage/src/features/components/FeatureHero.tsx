import React from 'react';
import { Feature } from '../types';

interface FeatureHeroProps {
  feature: Feature;
}

export function FeatureHero({ feature }: FeatureHeroProps) {
  return (
    <div className="mb-12">
      <h1 className="text-4xl font-bold mb-6">{feature.title}</h1>
      <p className="text-xl text-gray-600">{feature.description}</p>
    </div>
  );
}