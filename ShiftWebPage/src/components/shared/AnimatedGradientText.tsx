import React from 'react';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({ children, className = '' }: AnimatedGradientTextProps) {
  return (
    <span
      className={`animate-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 
        bg-[length:200%_auto] text-transparent bg-clip-text ${className}`}
    >
      {children}
    </span>
  );
}