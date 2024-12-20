import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FeatureSectionProps {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  image: string;
  reversed?: boolean;
}

export function FeatureSection({ id, title, description, benefits, image, reversed = false }: FeatureSectionProps) {
  return (
    <section id={id} className="py-24 scroll-mt-24">
      <div className="container mx-auto px-6">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${reversed ? 'md:grid-flow-dense' : ''}`}>
          <div className={reversed ? 'md:col-start-2' : ''}>
            <h2 className="text-3xl font-bold mb-6">{title}</h2>
            <p className="text-xl text-gray-600 mb-8">{description}</p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-2xl overflow-hidden ${reversed ? 'md:col-start-1' : ''}`}>
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}