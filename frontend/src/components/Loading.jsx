import React from 'react';

// Small reusable loading indicator. `label` should describe the actual
// in-progress request rather than being a generic spinner.
const Loading = ({ label = 'Loading...', size = 'md' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: size === 'sm' ? '0.85rem' : '0.95rem' }}>
    <span className="spinner" />
    <span>{label}</span>
  </div>
);

export default Loading;
