import React from 'react';

interface SpinnerProps {
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className = 'h-5 w-5 border-b-2 border-white' }) => {
  return (
    <div className={`animate-spin rounded-full ${className}`}></div>
  );
};