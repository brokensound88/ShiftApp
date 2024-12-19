import React from 'react';
import { Shield, Users, Lightbulb, Scale } from 'lucide-react';

interface ValueProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Value({ icon, title, description }: ValueProps) {
  return (
    <div className="p-8 bg-white rounded-2xl border border-cream-200">
      <div className="w-12 h-12 mb-6 flex items-center justify-center bg-blue-100 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export function Values() {
  return (
    <div className="py-16 bg-cream-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Value
            icon={<Shield className="w-6 h-6 text-blue-600" />}
            title="Trust & Security"
            description="We build trust through transparency and maintain the highest security standards in every aspect of our operations."
          />
          <Value
            icon={<Users className="w-6 h-6 text-blue-600" />}
            title="User-Centric"
            description="Our decisions are driven by user needs, ensuring our platform remains accessible and valuable to everyone."
          />
          <Value
            icon={<Lightbulb className="w-6 h-6 text-blue-600" />}
            title="Innovation"
            description="We continuously push the boundaries of what's possible in financial technology, leading the industry forward."
          />
          <Value
            icon={<Scale className="w-6 h-6 text-blue-600" />}
            title="Integrity"
            description="We maintain the highest ethical standards and ensure compliance while revolutionizing the financial system."
          />
        </div>
      </div>
    </div>
  );
}