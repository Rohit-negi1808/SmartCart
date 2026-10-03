import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/api.js';
import './Admin.css';

const EMPTY_FORM = {
  name: '', brand: '', price: '', originalPrice: '', image: '', description: '',
  processor: '', ram: '', storage: '', storageType: 'SSD', display: '', gpu: '',
  battery: '', operatingSystem: 'Windows 11', useCases: 'general', rating: '4.2',
  reviewCount: '0', stock: '10',
};

// A simple, self-contained admin product manager. Kept as a single page
// rather than a separate admin subsystem, per the project's "don't
// overengineer" guidance - it's still fully wired to the real API.
const Admin = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchProducts({ limit: 50 })
      .then((res) => setProducts(res.data.data))
      .catch((err) => setError(err.friendlyMessage || 'Could not load products'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (user?.role !== 'admin') {
    return (
      <div className="container admin-page">
        <div className="empty-state">
          <h3>Admin access required</h3>
          <p>Only admin accounts can manage the product catalog. Set a user's role to "admin" directly in MongoDB to test this page.</p>
        </div>
      </div>
    );
  }

  const buildPayload = () => ({
    name: form.name,
    brand: form.brand,
    category: 'laptop',
    price: Number(form.price),
    originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
    image: form.image || `https://picsum.photos/seed/${encodeURIComponent(form.name)}/600/400`,
    description: form.description,
    specifications: {
      processor: form.processor,
      ram: Number(form.ram),
      storage: Number(form.storage),
      storageType: form.storageType,
      display: form.display,
      gpu: form.gpu,
      battery: form.battery,
      operatingSystem: form.operatingSystem,
    },
    useCases: form.useCases.split(',').map((s) => s.trim()).filter(Boolean),
    rating: Number(form.rating),
    reviewCount: Number(form.reviewCount),
    stock: Number(form.stock),
    tags: [form.brand?.toLowerCase()].filter(Boolean),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.friendlyMessage || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name, brand: p.brand, price: p.price, originalPrice: p.originalPrice || '',
      image: p.image, description: p.description,
      processor: p.specifications.processor, ram: p.specifications.ram, storage: p.specifications.storage,
      storageType: p.specifications.storageType, display: p.specifications.display, gpu: p.specifications.gpu,
      battery: p.specifications.battery, operatingSystem: p.specifications.operatingSystem,
      useCases: p.useCases.join(', '), rating: p.rating, reviewCount: p.reviewCount, stock: p.stock,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.friendlyMessage || 'Could not delete product');
    }
  };

  return (
    <div className="container admin-page">
      <h1>Admin · Manage products</h1>
      <p>Add, edit, or remove products from the live catalog.</p>
      {error && <div className="error-banner">{error}</div>}

      <form className="card" style={{ padding: 24, marginTop: 20 }} onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit product' : 'Add new product'}</h3>
        <div className="admin-form-grid">
          <div className="field"><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Brand</label><input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
          <div className="field"><label>Price (₹)</label><input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="field"><label>Original price (₹)</label><input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} /></div>
          <div className="field"><label>Processor</label><input required value={form.processor} onChange={(e) => setForm({ ...form, processor: e.target.value })} /></div>
          <div className="field"><label>RAM (GB)</label><input type="number" required value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} /></div>
          <div className="field"><label>Storage (GB)</label><input type="number" required value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} /></div>
          <div className="field">
            <label>Storage type</label>
            <select value={form.storageType} onChange={(e) => setForm({ ...form, storageType: e.target.value })}>
              <option value="SSD">SSD</option><option value="HDD">HDD</option><option value="SSD+HDD">SSD+HDD</option>
            </select>
          </div>
          <div className="field"><label>Display</label><input required value={form.display} onChange={(e) => setForm({ ...form, display: e.target.value })} /></div>
          <div className="field"><label>GPU</label><input value={form.gpu} onChange={(e) => setForm({ ...form, gpu: e.target.value })} /></div>
          <div className="field"><label>Battery</label><input required value={form.battery} onChange={(e) => setForm({ ...form, battery: e.target.value })} /></div>
          <div className="field"><label>Use cases (comma separated)</label><input value={form.useCases} onChange={(e) => setForm({ ...form, useCases: e.target.value })} /></div>
          <div className="field"><label>Rating</label><input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
          <div className="field"><label>Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update product' : 'Add product'}</button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>Cancel edit</button>
          )}
        </div>
      </form>

      <h3 style={{ marginTop: 40 }}>Catalog ({products.length})</h3>
      {loading ? <Loading label="Loading products..." /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Brand</th><th>Price</th><th>RAM/Storage</th><th>Stock</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>₹{p.price.toLocaleString('en-IN')}</td>
                  <td>{p.specifications.ram}GB / {p.specifications.storage}GB</td>
                  <td>{p.stock}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Admin;
