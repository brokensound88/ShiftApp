import React from 'react';

interface MilestoneProps {
  year: string;
  title: string;
  description: string;
}

function Milestone({ year, title, description }: MilestoneProps) {
  return (
    <div className="flex gap-8">
      <div className="w-32 flex-shrink-0">
        <span className="text-2xl font-bold text-blue-600">{year}</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function Timeline() {
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-12 text-center">Our Journey</h2>
        <div className="max-w-3xl mx-auto space-y-12">
          <Milestone
            year="2024"
            title="Global Expansion"
            description="Expanded operations to 180+ countries, enabling truly global payment infrastructure."
          />
          <Milestone
            year="2023"
            title="Series B Funding"
            description="Secured $50M in Series B funding to accelerate platform development and market expansion."
          />
          <Milestone
            year="2022"
            title="Platform Launch"
            description="Launched our revolutionary payment platform, processing over $100M in transactions in the first month."
          />
          <Milestone
            year="2021"
            title="Foundation"
            description="Founded with a vision to transform global payments through blockchain technology."
          />
        </div>
      </div>
    </div>
  );
}