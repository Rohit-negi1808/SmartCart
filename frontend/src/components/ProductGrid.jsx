import React from 'react';
import ProductCard from './ProductCard.jsx';

/**
 * Renders a grid of ProductCards, or a friendly empty state when there
 * are no products to show. Wishlist/compare state is passed through
 * from the parent page so this stays a thin presentational component.
 */
const ProductGrid = ({
  products,
  matchScores,
  wishlistIds = [],
  onToggleWishlist,
  wishlistBusyId,
  compareIds = [],
  onToggleCompare,
  emptyTitle = 'No products found.',
  emptyHint = 'Try adjusting your filters or search again.',
}) => {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          matchScore={matchScores ? matchScores[product._id] : product.matchScore}
          isWishlisted={wishlistIds.includes(product._id)}
          onToggleWishlist={onToggleWishlist}
          wishlistBusy={wishlistBusyId === product._id}
          isComparing={compareIds.includes(product._id)}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
