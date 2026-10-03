import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiBarChart2 } from 'react-icons/fi';
import './ProductCard.css';

const formatINR = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—';

/**
 * A single product tile used across the results, home, and wishlist pages.
 * `matchScore` is optional - only AI search results have it.
 */
const ProductCard = ({
  product,
  matchScore,
  isWishlisted,
  onToggleWishlist,
  isComparing,
  onToggleCompare,
  wishlistBusy,
}) => {
  const { _id, name, brand, price, originalPrice, image, specifications, rating, reviewCount } = product;
  const discount =
    originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="product-card card">
      <div className="product-card-media">
        <img src={image} alt={name} loading="lazy" />
        {typeof matchScore === 'number' && (
          <span className="badge badge-match product-card-match">{matchScore}% Match</span>
        )}
        {discount > 0 && <span className="product-card-discount">-{discount}%</span>}
      </div>

      <div className="product-card-body">
        <div className="product-card-brand">{brand}</div>
        <Link to={`/products/${_id}`} className="product-card-name">{name}</Link>

        <div className="product-card-rating">
          <span className="mono">★ {rating?.toFixed(1) ?? '—'}</span>
          <span className="product-card-reviews">({reviewCount ?? 0})</span>
        </div>

        <div className="product-card-price">
          <span className="product-card-price-now">{formatINR(price)}</span>
          {originalPrice > price && (
            <span className="product-card-price-old">{formatINR(originalPrice)}</span>
          )}
        </div>

        <div className="product-card-specs mono">
          {specifications?.ram}GB RAM • {specifications?.storage}GB {specifications?.storageType}
          <br />
          {specifications?.processor}
        </div>

        <div className="product-card-actions">
          <button
            className={`icon-toggle ${isComparing ? 'is-active' : ''}`}
            title="Add to comparison"
            onClick={() => onToggleCompare?.(product)}
          >
            <FiBarChart2 />
          </button>
          <button
            className={`icon-toggle ${isWishlisted ? 'is-active' : ''}`}
            title="Save to wishlist"
            onClick={() => onToggleWishlist?.(product)}
            disabled={wishlistBusy}
          >
            <FiHeart />
          </button>
          <Link to={`/products/${_id}`} className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
            View details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
