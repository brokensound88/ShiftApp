import React from 'react';

interface PressReleaseProps {
  date: string;
  title: string;
  source: string;
  link: string;
}

export function PressRelease({ date, title, source, link }: PressReleaseProps) {
  return (
    <a 
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-6 bg-white rounded-xl border border-cream-200 hover:border-blue-600 transition-colors"
    >
      <time className="text-sm text-gray-500">{date}</time>
      <h3 className="text-xl font-semibold mt-2 mb-1">{title}</h3>
      <p className="text-gray-600">{source}</p>
    </a>
  );
}