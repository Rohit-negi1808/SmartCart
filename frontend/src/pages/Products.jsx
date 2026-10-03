import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Loading from '../components/Loading.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCompare } from '../context/CompareContext.jsx';
import {
  fetchProducts,
  fetchFilterOptions,
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../services/api.js';
import './Products.css';

const DEFAULT_FILTERS = {
  brand: '', maxPrice: '', minRam: '', storageType: '', useCase: '', minRating: '',
};

const Products = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { compareIds, toggleCompare } = useCompare();

  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    useCase: searchParams.get('useCase') || '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistBusyId, setWishlistBusyId] = useState(null);

  useEffect(() => {
    fetchFilterOptions().then((res) => setBrands(res.data.data.brands)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist().then((res) => setWishlistIds(res.data.data.map((p) => p._id))).catch(() => {});
    } else {
      setWishlistIds([]);
    }
  }, [isAuthenticated]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {
      page,
      limit: 12,
      sort: sort === 'relevance' ? undefined : sort,
      search: searchTerm || undefined,
      brand: filters.brand || undefined,
      maxPrice: filters.maxPrice || undefined,
      minRam: filters.minRam || undefined,
      storageType: filters.storageType || undefined,
      useCase: filters.useCase || undefined,
      minRating: filters.minRating || undefined,
    };
    fetchProducts(params)
      .then((res) => {
        setProducts(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => setError(err.friendlyMessage || 'Could not load products'))
      .finally(() => setLoading(false));
  }, [page, sort, searchTerm, filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFilterChange = (next) => {
    setFilters(next);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchTerm('');
    setSort('relevance');
    setPage(1);
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

  return (
    <div className="container products-page">
      <div className="products-toolbar">
        <div className="field" style={{ marginBottom: 0, minWidth: 260, flex: 1 }}>
          <input
            type="text"
            placeholder="Search products by name, brand, tag..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="products-layout">
        <FilterPanel filters={filters} onChange={handleFilterChange} brands={brands} onReset={handleReset} />

        <div>
          <div className="products-count">
            {loading ? 'Loading...' : `${meta.total} product${meta.total === 1 ? '' : 's'} found`}
          </div>

          <div style={{ marginTop: 16 }}>
            {loading ? (
              <Loading label="Loading products..." />
            ) : (
              <ProductGrid
                products={products}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
                wishlistBusyId={wishlistBusyId}
                compareIds={compareIds}
                onToggleCompare={toggleCompare}
                emptyTitle="No products found."
                emptyHint="Try increasing your budget or changing your filters."
              />
            )}
          </div>

          {!loading && meta.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Page {page} of {meta.pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
