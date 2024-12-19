import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { features } from '../data/features';
import { FeatureHero } from '../components/FeatureHero';
import { FeatureContent } from '../components/FeatureContent';

export function FeatureDetail() {
  const { slug } = useParams();
  const feature = features[slug as keyof typeof features];

  if (!feature) {
    return <Navigate to="/features" replace />;
  }

  return (
    <div className="pt-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <FeatureHero feature={feature} />
          <FeatureContent feature={feature} />
        </div>
      </div>
    </div>
  );
}