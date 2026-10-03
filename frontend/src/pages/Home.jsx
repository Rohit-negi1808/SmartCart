import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Loading from '../components/Loading.jsx';
import { fetchProducts } from '../services/api.js';
import './Home.css';

const CATEGORIES = [
  { label: 'Programming', useCase: 'programming', hint: 'Fast compiles, great keyboards' },
  { label: 'Gaming', useCase: 'gaming', hint: 'High refresh, dedicated GPUs' },
  { label: 'Student', useCase: 'student', hint: 'Light, affordable, long battery' },
  { label: 'Business', useCase: 'business', hint: 'Portable and reliable' },
  { label: 'Video Editing', useCase: 'video-editing', hint: 'Colour-accurate, powerful' },
  { label: 'General Use', useCase: 'general', hint: 'Everyday browsing and work' },
];

const Home = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts({ sort: 'rating', limit: 8 })
      .then((res) => setFeatured(res.data.data))
      .catch((err) => setError(err.friendlyMessage || 'Could not load featured products'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (query) => {
    navigate('/ai-search', { state: { query, autoRun: true } });
  };

  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="hero-eyebrow">AI-powered product discovery</div>
            <h1>Describe the laptop you need. We'll find the real one.</h1>
            <p className="hero-sub">
              SmartCart reads your requirements in plain language, turns them into structured
              filters, and ranks real products from our catalog — no guesswork, no invented specs.
            </p>
            <div className="hero-search">
              <SearchBar onSearch={handleSearch} large />
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">60+</div>
                <div className="hero-stat-label">Laptops indexed</div>
              </div>
              <div>
                <div className="hero-stat-num">10</div>
                <div className="hero-stat-label">Brands covered</div>
              </div>
              <div>
                <div className="hero-stat-num">6</div>
                <div className="hero-stat-label">Use cases scored</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div style={{ fontSize: '0.82rem', color: 'var(--text-faint)', marginBottom: 12 }}>
              We understood your requirements
            </div>
            <div className="hero-visual-row">
              <span className="hero-visual-label">Budget</span>
              <span className="hero-visual-value">₹70,000</span>
            </div>
            <div className="hero-visual-row">
              <span className="hero-visual-label">RAM</span>
              <span className="hero-visual-value">16GB+</span>
            </div>
            <div className="hero-visual-row">
              <span className="hero-visual-label">Use case</span>
              <span className="hero-visual-value">Programming</span>
            </div>
            <div className="hero-visual-row">
              <span className="hero-visual-label">Storage</span>
              <span className="hero-visual-value">SSD</span>
            </div>
            <div className="hero-visual-row">
              <span className="hero-visual-label">Top match</span>
              <span className="hero-visual-value hero-visual-score">92%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Shop by use case</h2>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <div key={c.useCase} className="category-card" onClick={() => navigate(`/products?useCase=${c.useCase}`)}>
              <h4>{c.label}</h4>
              <p>{c.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Featured products</h2>
          <Link to="/products" className="btn btn-secondary btn-sm">Browse all</Link>
        </div>
        {loading && <Loading label="Loading featured products..." />}
        {error && <div className="error-banner">{error}</div>}
        {!loading && !error && <ProductGrid products={featured} />}
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>How SmartCart works</h2>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-num">01</div>
            <h4>Describe your needs</h4>
            <p>Tell SmartCart what you need in your own words — budget, use case, specs, anything.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">02</div>
            <h4>Gemini extracts requirements</h4>
            <p>Our backend sends your query to Gemini, which converts it into structured filters.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">03</div>
            <h4>We search real inventory</h4>
            <p>Those filters query our MongoDB product catalog — Gemini never invents products.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">04</div>
            <h4>Results are ranked and explained</h4>
            <p>A transparent scoring engine ranks matches, and Gemini explains each one in plain language.</p>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="cta-band">
          <h2>Ready to find your perfect laptop?</h2>
          <p>Skip the spec-sheet spelunking. Tell us what you need and let the ranking do the work.</p>
          <Link to="/ai-search" className="btn btn-primary">Find My Perfect Product</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
