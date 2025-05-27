
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps): JSX.Element => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-t-2 border-b-2',
    md: 'h-10 w-10 border-t-4 border-b-4',
    lg: 'h-16 w-16 border-t-4 border-b-4'
  };
  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} border-pink-500`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};