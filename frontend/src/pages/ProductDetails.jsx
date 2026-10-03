import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiHeart, FiBarChart2, FiZap } from 'react-icons/fi';
import Loading from '../components/Loading.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import {
  fetchProductById,
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  aiExplain,
} from '../services/api.js';
import './ProductDetails.css';

const formatINR = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const ProductDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { compareIds, toggleCompare } = useCompare();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const [explanation, setExplanation] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setExplanation(null);
    fetchProductById(id)
      .then((res) => setProduct(res.data.data))
      .catch((err) => setError(err.friendlyMessage || 'Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist()
        .then((res) => setIsWishlisted(res.data.data.some((p) => p._id === id)))
        .catch(() => {});
    }
  }, [isAuthenticated, id]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      setError('Log in to save products to your wishlist.');
      return;
    }
    setWishlistBusy(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(id);
        setIsWishlisted(true);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Could not update wishlist');
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleExplain = async () => {
    setExplainLoading(true);
    try {
      // Without a prior AI search, we pass empty requirements - the
      // explanation will focus on general strengths of the product.
      const res = await aiExplain(id, {});
      setExplanation(res.data.data);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not generate AI analysis');
    } finally {
      setExplainLoading(false);
    }
  };

  if (loading) {
    return <div className="container pd-page"><Loading label="Loading product..." /></div>;
  }

  if (error && !product) {
    return (
      <div className="container pd-page">
        <div className="error-banner">{error}</div>
        <Link to="/products" className="btn btn-secondary">Back to products</Link>
      </div>
    );
  }

  if (!product) return null;

  const { name, brand, price, originalPrice, image, description, specifications, useCases, rating, reviewCount, stock } = product;
  const discount = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="container pd-page">
      <Link to="/products" className="pd-back"><FiArrowLeft /> Back to products</Link>
      {error && <div className="error-banner">{error}</div>}

      <div className="pd-grid">
        <div className="pd-image"><img src={image} alt={name} /></div>

        <div>
          <div className="pd-brand">{brand}</div>
          <h1 className="pd-name">{name}</h1>
          <div className="pd-rating">★ {rating?.toFixed(1)} · {reviewCount} reviews</div>

          <div className="pd-price-row">
            <span className="pd-price">{formatINR(price)}</span>
            {originalPrice > price && <span className="pd-price-old">{formatINR(originalPrice)}</span>}
            {discount > 0 && <span className="pd-discount">Save {discount}%</span>}
          </div>

          <div className={`pd-stock ${stock > 0 ? 'in' : 'out'}`}>
            {stock > 0 ? `In stock (${stock} available)` : 'Out of stock'}
          </div>

          <p>{description}</p>

          <div className="pd-usecases">
            {useCases?.map((uc) => <span key={uc} className="pd-usecase-tag">{uc.replace('-', ' ')}</span>)}
          </div>

          <div className="pd-actions" style={{ marginTop: 24 }}>
            <button
              className={`btn ${isWishlisted ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleToggleWishlist}
              disabled={wishlistBusy}
            >
              <FiHeart /> {isWishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
            </button>
            <button
              className={`btn ${compareIds.includes(id) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => toggleCompare(product)}
            >
              <FiBarChart2 /> {compareIds.includes(id) ? 'Added to compare' : 'Add to comparison'}
            </button>
          </div>

          <table className="pd-spec-table">
            <tbody>
              <tr><td>Processor</td><td>{specifications.processor}</td></tr>
              <tr><td>RAM</td><td>{specifications.ram}GB</td></tr>
              <tr><td>Storage</td><td>{specifications.storage}GB {specifications.storageType}</td></tr>
              <tr><td>Display</td><td>{specifications.display}</td></tr>
              <tr><td>GPU</td><td>{specifications.gpu}</td></tr>
              <tr><td>Battery</td><td>{specifications.battery}</td></tr>
              <tr><td>OS</td><td>{specifications.operatingSystem}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="ai-explain-box">
        <h3><FiZap color="var(--accent)" /> Why this product matches your needs</h3>
        {!explanation && !explainLoading && (
          <>
            <p style={{ marginTop: 8 }}>Ask AI for a plain-language analysis based on this product's actual specifications.</p>
            <button className="btn btn-primary btn-sm" onClick={handleExplain}>Analyze with AI</button>
          </>
        )}
        {explainLoading && <Loading label="Analyzing the results..." />}
        {explanation && (
          <>
            <div className="badge badge-match" style={{ marginBottom: 12 }}>{explanation.matchScore}% Match</div>
            <ul className="ai-explain-list">
              {explanation.explanation
                .split('\n')
                .map((line) => line.replace(/^- /, '').trim())
                .filter(Boolean)
                .map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
