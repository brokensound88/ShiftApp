import React from 'react';
import { TeamMemberCard } from '../../components/company/TeamMemberCard';

export function Team() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Our Team</h1>
        <p className="text-xl text-gray-600">
          Meet the innovators and experts building the future of global payments.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        <TeamMemberCard
          name="Sarah Chen"
          role="Chief Executive Officer"
          image="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800"
          linkedin="https://linkedin.com"
        />
        <TeamMemberCard
          name="Marcus Rodriguez"
          role="Chief Technology Officer"
          image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800"
          linkedin="https://linkedin.com"
        />
        <TeamMemberCard
          name="Aisha Patel"
          role="Head of Product"
          image="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800"
          linkedin="https://linkedin.com"
        />
      </div>
    </div>
  );
}