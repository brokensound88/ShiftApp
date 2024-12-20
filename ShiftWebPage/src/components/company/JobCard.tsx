import React from 'react';

interface JobCardProps {
  title: string;
  location: string;
  department: string;
  type: string;
}

export function JobCard({ title, location, department, type }: JobCardProps) {
  return (
    <div className="p-6 bg-white rounded-xl border border-cream-200 hover:border-blue-600 transition-colors">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="space-y-2">
        <Detail label="Location" value={location} />
        <Detail label="Department" value={department} />
        <Detail label="Type" value={type} />
      </div>
      <button className="mt-4 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
        View Position →
      </button>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center text-sm">
      <span className="text-gray-500 w-24">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}