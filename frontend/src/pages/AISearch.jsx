import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { aiSearch, fetchWishlist, addToWishlist, removeFromWishlist } from '../services/api.js';
import './AISearch.css';

const PROCESSING_STEPS = [
  'Understanding your requirements...',
  'Searching the product catalog...',
  'Ranking the best matches...',
];

const REQUIREMENT_LABELS = {
  maxPrice: (v) => `Budget: ₹${Number(v).toLocaleString('en-IN')}`,
  minPrice: (v) => `Min budget: ₹${Number(v).toLocaleString('en-IN')}`,
  minRam: (v) => `RAM: ${v}GB+`,
  storageType: (v) => `Storage: ${v}`,
  useCase: (v) => `Use: ${String(v).replace('-', ' ')}`,
  batteryPreference: (v) => `Battery: ${v}`,
  brand: (v) => `Brand: ${v}`,
};

const AISearch = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { compareIds, toggleCompare } = useCompare();

  const [query, setQuery] = useState(location.state?.query || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // { requirements, products, aiFailed }
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistBusyId, setWishlistBusyId] = useState(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist()
        .then((res) => setWishlistIds(res.data.data.map((p) => p._id)))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (location.state?.autoRun && location.state?.query && !ranOnce.current) {
      ranOnce.current = true;
      runSearch(location.state.query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const runSearch = async (q) => {
    setLoading(true);
    setError('');
    setResults(null);
    setStep(0);

    const stepTimer1 = setTimeout(() => setStep(1), 400);
    const stepTimer2 = setTimeout(() => setStep(2), 900);

    try {
      const res = await aiSearch(q);
      setResults(res.data.data);
    } catch (err) {
      setError(err.friendlyMessage || 'AI search failed. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
    }
  };

  const handleSearch = (q) => {
    setQuery(q);
    runSearch(q);
  };

  const handleToggleWishlist = async (product) => {
    if (!isAuthenticated) {
      setError('Log in to save products to your wishlist.');
      return;
    }
    setWishlistBusyId(product._id);
    try {
      const isSaved = wishlistIds.includes(product._id);
      if (isSaved) {
        await removeFromWishlist(product._id);
        setWishlistIds((prev) => prev.filter((id) => id !== product._id));
      } else {
        await addToWishlist(product._id);
        setWishlistIds((prev) => [...prev, product._id]);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Could not update wishlist');
    } finally {
      setWishlistBusyId(null);
    }
  };

  const requirementEntries = results?.requirements
    ? Object.entries(results.requirements).filter(
        ([key, value]) => REQUIREMENT_LABELS[key] && value !== null && value !== undefined
      )
    : [];

  return (
    <div className="container">
      <div className="ai-search-hero">
        <h1>What are you looking for?</h1>
        <p>Describe your ideal laptop in plain language — budget, use case, specs, anything that matters to you.</p>
        <div className="ai-search-box">
          <SearchBar onSearch={handleSearch} loading={loading} initialValue={query} large />
        </div>
      </div>

      {loading && (
        <div className="ai-processing">
          <span className="spinner" />
          <div className="ai-processing-steps">
            {PROCESSING_STEPS.map((label, i) => (
              <div
                key={label}
                className={`ai-processing-step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
              >
                {i < step ? '✓' : '•'} {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {!loading && results && (
        <>
          {results.aiFailed && (
            <div className="ai-warning">
              Our AI understanding step had trouble with that request, so we're showing general
              results instead. Try rephrasing, or use the filters on the Products page.
            </div>
          )}

          {requirementEntries.length > 0 && (
            <div className="requirements-panel">
              <h4>We understood your requirements:</h4>
              <div className="requirements-chips">
                {requirementEntries.map(([key, value]) => (
                  <span key={key} className="requirement-chip">{REQUIREMENT_LABELS[key](value)}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ margin: '28px 0 60px' }}>
            <ProductGrid
              products={results.products}
              wishlistIds={wishlistIds}
              onToggleWishlist={handleToggleWishlist}
              wishlistBusyId={wishlistBusyId}
              compareIds={compareIds}
              onToggleCompare={toggleCompare}
              emptyTitle="No products matched your requirements."
              emptyHint="Try increasing your budget or loosening your requirements."
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AISearch;
