import React from 'react';

interface TeamMemberProps {
  name: string;
  role: string;
  image: string;
  linkedin?: string;
}

export function TeamMemberCard({ name, role, image, linkedin }: TeamMemberProps) {
  return (
    <div className="group relative">
      <div className="aspect-square overflow-hidden rounded-2xl">
        <img 
          src={image} 
          alt={name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-gray-600">{role}</p>
        {linkedin && (
          <a 
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block"
          >
            LinkedIn →
          </a>
        )}
      </div>
    </div>
  );
}