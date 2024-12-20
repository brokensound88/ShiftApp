import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FeatureCard } from '../components/shared/FeatureCard';
import { StatCard } from '../components/shared/StatCard';
import { AnimatedGradientText } from '../components/shared/AnimatedGradientText';
import { features } from '../features/data/features';
import * as Icons from 'lucide-react';

export function Home() {
  const featuredFeatures = Object.values(features).slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              The Future of{' '}
              <AnimatedGradientText>
                Payments
              </AnimatedGradientText>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12">
              Transform global payments with near-zero fees, instant settlements, and complete transparency
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/features"
                className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-cream-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {featuredFeatures.map((feature) => {
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
          <div className="text-center mt-12">
            <Link
              to="/features"
              className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-2 justify-center"
            >
              View All Features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-cream-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <StatCard 
              value="$2T+" 
              label="Market Size" 
              vision="With just 1% market share ($20B), we'll revolutionize finance by reinvesting profits into AI-driven trading systems and sustainable crypto projects, creating a self-reinforcing ecosystem that benefits all stakeholders."
              image="https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=80&w=1600"
            />
            <StatCard 
              value="0.1%" 
              label="Transaction Fee" 
              vision="By maintaining minimal fees, we'll process millions of micro-transactions daily, enabling new business models and financial inclusion while generating sustainable revenue through volume rather than high fees."
              image="https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&q=80&w=1600"
            />
            <StatCard 
              value="10k+" 
              label="Beta Users" 
              vision="Our early adopters will become the foundation of a global financial revolution, helping us shape a future where everyone has equal access to financial services and opportunities."
              image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1600"
            />
          </div>
        </div>
      </section>
    </div>
  );
}