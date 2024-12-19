import React from 'react';
import { JobCard } from '../../components/company/JobCard';

export function Careers() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
        <p className="text-xl text-gray-600">
          Help us build the future of financial technology. We're always looking for exceptional talent.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <JobCard
          title="Senior Blockchain Engineer"
          location="Remote"
          department="Engineering"
          type="Full-time"
        />
        <JobCard
          title="Product Designer"
          location="New York, NY"
          department="Design"
          type="Full-time"
        />
        <JobCard
          title="Growth Marketing Manager"
          location="London, UK"
          department="Marketing"
          type="Full-time"
        />
        <JobCard
          title="Customer Success Lead"
          location="Singapore"
          department="Operations"
          type="Full-time"
        />
      </div>
    </div>
  );
}