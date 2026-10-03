import React from 'react';

/**
 * Sidebar filter controls for the Products results page. All filter
 * state is owned by the parent (Products.jsx) - this is a controlled,
 * presentational component.
 */
const FilterPanel = ({ filters, onChange, brands = [], onReset }) => {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="filter-panel card">
      <div className="filter-panel-header">
        <h4 style={{ margin: 0 }}>Filters</h4>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>Reset</button>
      </div>

      <div className="field">
        <label>Brand</label>
        <select value={filters.brand} onChange={(e) => set('brand', e.target.value)}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Max price (₹)</label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 70000"
          value={filters.maxPrice}
          onChange={(e) => set('maxPrice', e.target.value)}
        />
      </div>

      <div className="field">
        <label>Minimum RAM</label>
        <select value={filters.minRam} onChange={(e) => set('minRam', e.target.value)}>
          <option value="">Any</option>
          <option value="8">8GB+</option>
          <option value="16">16GB+</option>
          <option value="32">32GB+</option>
        </select>
      </div>

      <div className="field">
        <label>Storage type</label>
        <select value={filters.storageType} onChange={(e) => set('storageType', e.target.value)}>
          <option value="">Any</option>
          <option value="SSD">SSD</option>
          <option value="HDD">HDD</option>
          <option value="SSD+HDD">SSD + HDD</option>
        </select>
      </div>

      <div className="field">
        <label>Use case</label>
        <select value={filters.useCase} onChange={(e) => set('useCase', e.target.value)}>
          <option value="">Any</option>
          <option value="programming">Programming</option>
          <option value="gaming">Gaming</option>
          <option value="student">Student</option>
          <option value="business">Business</option>
          <option value="video-editing">Video Editing</option>
          <option value="general">General Use</option>
        </select>
      </div>

      <div className="field">
        <label>Minimum rating</label>
        <select value={filters.minRating} onChange={(e) => set('minRating', e.target.value)}>
          <option value="">Any</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
      </div>
    </aside>
  );
};

export default FilterPanel;
