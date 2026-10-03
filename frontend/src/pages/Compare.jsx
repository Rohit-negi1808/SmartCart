import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';
import Loading from '../components/Loading.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { aiCompare } from '../services/api.js';
import './Compare.css';

const formatINR = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const ROWS = [
  { label: 'Price', get: (p) => formatINR(p.price) },
  { label: 'Processor', get: (p) => p.specifications.processor },
  { label: 'RAM', get: (p) => `${p.specifications.ram}GB` },
  { label: 'Storage', get: (p) => `${p.specifications.storage}GB ${p.specifications.storageType}` },
  { label: 'GPU', get: (p) => p.specifications.gpu },
  { label: 'Display', get: (p) => p.specifications.display },
  { label: 'Battery', get: (p) => p.specifications.battery },
  { label: 'Rating', get: (p) => `★ ${p.rating?.toFixed(1)} (${p.reviewCount})` },
  { label: 'Use cases', get: (p) => p.useCases.join(', ') },
];

// Highlights a row's cells if not every product has the same value for it.
const rowValuesDiffer = (items, row) => {
  const values = items.map((p) => row.get(p));
  return new Set(values).size > 1;
};

const Compare = () => {
  const { items, removeFromCompare, clearCompare } = useCompare();
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAskAI = async () => {
    setAiLoading(true);
    setError('');
    try {
      const res = await aiCompare(items.map((p) => p._id));
      setAiText(res.data.data.comparison);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not generate AI comparison');
    } finally {
      setAiLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container compare-page">
        <div className="empty-state">
          <h3>No products selected for comparison.</h3>
          <p>Add products to comparison from the products page or product details.</p>
          <div className="compare-empty-picker">
            <Link to="/products" className="btn btn-primary">Browse products</Link>
            <Link to="/ai-search" className="btn btn-secondary">Try AI search</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container compare-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Compare products</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={handleAskAI} disabled={aiLoading || items.length < 2}>
            <FiZap /> {aiLoading ? 'Comparing...' : 'Ask AI to compare'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearCompare}>Clear all</button>
        </div>
      </div>

      {items.length < 2 && (
        <div className="ai-warning" style={{ marginTop: 20 }}>
          Add at least one more product to see a full comparison and enable the AI comparison.
        </div>
      )}
      {error && <div className="error-banner" style={{ marginTop: 20 }}>{error}</div>}

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th></th>
              {items.map((p) => (
                <th key={p._id} className="compare-col-header">
                  <img src={p.image} alt={p.name} />
                  <h4>{p.name}</h4>
                  <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>{p.brand}</div>
                  <button className="compare-remove" onClick={() => removeFromCompare(p._id)}>Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const differs = items.length > 1 && rowValuesDiffer(items, row);
              return (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  {items.map((p) => (
                    <td key={p._id} className={differs ? 'compare-cell-diff' : ''}>{row.get(p)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(aiText || aiLoading) && (
        <div className="ai-compare-box">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <FiZap color="var(--accent)" /> AI comparison
          </h3>
          {aiLoading ? (
            <div style={{ marginTop: 12 }}><Loading label="Analyzing the results..." /></div>
          ) : (
            <p style={{ marginTop: 12, whiteSpace: 'pre-line', color: 'var(--text)' }}>{aiText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Compare;
