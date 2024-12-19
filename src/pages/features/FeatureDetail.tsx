import React from 'react';
import { useParams } from 'react-router-dom';
import { features } from './featureData';

export function FeatureDetail() {
  const { slug } = useParams();
  const feature = features[slug as keyof typeof features];

  if (!feature) {
    return <div>Feature not found</div>;
  }

  return (
    <div className="pt-32">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-6">{feature.title}</h1>
            <p className="text-xl text-gray-600">{feature.description}</p>
          </div>

          <div className="prose prose-lg max-w-none">
            {feature.content}
          </div>
        </div>
      </div>
    </div>
  );
}