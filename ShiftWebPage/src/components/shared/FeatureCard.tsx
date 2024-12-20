import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  slug: string;
}

export function FeatureCard({ icon, title, description, slug }: FeatureCardProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/features/${slug}`);
  };

  return (
    <button 
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl transition-all duration-500 text-left w-full"
    >
      <div className="p-8 bg-white border border-cream-200 rounded-2xl relative z-10 h-full
        group-hover:border-transparent transition-colors duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-0 
          group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="mb-4 text-blue-600 group-hover:text-white transition-colors duration-500">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-white transition-colors duration-500">
            {title}
          </h3>
          <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-500">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}