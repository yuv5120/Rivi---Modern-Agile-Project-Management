import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => (
  <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
);

export const LoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => (
  <div className="loading-screen">
    <Spinner size="lg" />
    <p style={{ color: 'var(--color-text-subtle)', fontSize: 14 }}>{message}</p>
  </div>
);
