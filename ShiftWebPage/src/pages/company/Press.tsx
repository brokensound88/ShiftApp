import React from 'react';
import { PressRelease } from '../../components/company/PressRelease';

export function Press() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Press & News</h1>
        <p className="text-xl text-gray-600">
          Latest updates, announcements, and media coverage about Shift.
        </p>
      </div>

      <div className="space-y-6 mt-12">
        <PressRelease
          date="March 15, 2024"
          title="Shift Raises $50M Series B to Transform Global Payments"
          source="TechCrunch"
          link="https://techcrunch.com"
        />
        <PressRelease
          date="February 28, 2024"
          title="How Shift is Making Cross-Border Payments Instant and Free"
          source="Forbes"
          link="https://forbes.com"
        />
        <PressRelease
          date="January 12, 2024"
          title="Shift Expands to Southeast Asian Markets"
          source="Bloomberg"
          link="https://bloomberg.com"
        />
      </div>
    </div>
  );
}