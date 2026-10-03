import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={{ borderTop: '1px solid var(--border)', marginTop: 80 }}>
    <div className="container" style={{ padding: '40px 24px', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
      <div style={{ maxWidth: 320 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>SmartCart</div>
        <p style={{ fontSize: '0.88rem' }}>
          AI-powered product discovery for laptops and tech. Describe what you need, and we'll find real products that fit.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 10, fontSize: '0.85rem' }}>Explore</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/ai-search">AI Search</Link>
            <Link to="/products">Browse products</Link>
            <Link to="/compare">Compare</Link>
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 10, fontSize: '0.85rem' }}>Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
      © {new Date().getFullYear()} SmartCart. A portfolio project — not a real store.
    </div>
  </footer>
);

export default Footer;
