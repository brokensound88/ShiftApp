import React from 'react';
import { Mission } from './about/components/Mission';
import { Values } from './about/components/Values';
import { Vision } from './about/components/Vision';
import { Timeline } from './about/components/Timeline';

export function About() {
  return (
    <div className="pt-32">
      {/* Hero Section */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">About Shift</h1>
            <p className="text-xl text-gray-600">
              We're building the future of financial infrastructure, enabling seamless global transactions through blockchain technology and smart contracts.
            </p>
          </div>
        </div>
      </section>

      <Mission />
      <Values />
      <Vision />
      <Timeline />
    </div>
  );
}