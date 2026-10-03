import React, { useEffect, useState } from 'react';
import ProductGrid from '../components/ProductGrid.jsx';
import Loading from '../components/Loading.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import { fetchWishlist, removeFromWishlist } from '../services/api.js';

const Wishlist = () => {
  const { compareIds, toggleCompare } = useCompare();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchWishlist()
      .then((res) => setProducts(res.data.data))
      .catch((err) => setError(err.friendlyMessage || 'Could not load wishlist'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (product) => {
    setBusyId(product._id);
    try {
      await removeFromWishlist(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      setError(err.friendlyMessage || 'Could not remove product');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0 80px' }}>
      <h1>Your wishlist</h1>
      <p>Products you've saved to look at again or compare later.</p>
      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <Loading label="Loading your wishlist..." />
      ) : (
        <ProductGrid
          products={products}
          wishlistIds={products.map((p) => p._id)}
          onToggleWishlist={handleRemove}
          wishlistBusyId={busyId}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          emptyTitle="Your wishlist is empty."
          emptyHint="Save products you want to compare later."
        />
      )}
    </div>
  );
};

export default Wishlist;
