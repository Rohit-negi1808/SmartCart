import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import Loading from '../components/Loading.jsx';
import { fetchWishlist, fetchSearchHistory } from '../services/api.js';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { items: compareItems } = useCompare();
  const [wishlistCount, setWishlistCount] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchWishlist(), fetchSearchHistory()])
      .then(([wishlistRes, historyRes]) => {
        setWishlistCount(wishlistRes.data.data.length);
        setHistory(historyRes.data.data);
      })
      .catch((err) => setError(err.friendlyMessage || 'Could not load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container dashboard-page">
      <h1>Dashboard</h1>
      <p>Your account, saved products, and recent activity.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-profile card">
          <div className="dashboard-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <h3 style={{ margin: '0 0 4px' }}>{user?.name}</h3>
          <p style={{ fontSize: '0.85rem' }}>{user?.email}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>Role: {user?.role}</p>
        </div>

        <div>
          <div className="dashboard-section">
            <h3>Saved products</h3>
            {loading ? (
              <Loading label="Loading..." size="sm" />
            ) : (
              <p>
                You have <strong style={{ color: 'var(--text)' }}>{wishlistCount}</strong> product{wishlistCount === 1 ? '' : 's'} saved.{' '}
                <Link to="/wishlist">View wishlist →</Link>
              </p>
            )}
          </div>

          <div className="dashboard-section">
            <h3>Currently comparing</h3>
            {compareItems.length === 0 ? (
              <p>No products selected for comparison yet. <Link to="/products">Browse products</Link> to add some.</p>
            ) : (
              <p>
                {compareItems.length} product{compareItems.length === 1 ? '' : 's'} selected.{' '}
                <Link to="/compare">Go to comparison →</Link>
              </p>
            )}
          </div>

          <div className="dashboard-section card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 16px 0' }}><h3>Recent AI searches</h3></div>
            {loading ? (
              <div style={{ padding: 16 }}><Loading label="Loading search history..." size="sm" /></div>
            ) : history.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <h3 style={{ fontSize: '1rem' }}>No searches yet</h3>
                <p>Your AI search history will show up here.</p>
                <Link to="/ai-search" className="btn btn-primary btn-sm">Try AI Search</Link>
              </div>
            ) : (
              history.map((h) => (
                <div className="history-item" key={h._id}>
                  <div>
                    <div className="history-query">"{h.query}"</div>
                    <div className="history-meta">{h.resultCount} results · {new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
