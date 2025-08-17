import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const spinnerSizes = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '200px' }}>
      <div className={`spinner-border ${spinnerSizes[size]} text-primary`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      {text && (
        <p className="mt-3 text-muted">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
