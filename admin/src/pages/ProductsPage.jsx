import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Image } from 'lucide-react';

const EMPTY = {
  name: '', brand: '', category: '', price: '', discountPrice: '',
  countInStock: '', description: '',
  images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
  colors: 'Black, White', sizes: 'S, M, L, XL',
  isFeatured: false, isBestSeller: false, isFlashSale: false,
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditProduct(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name, brand: p.brand, category: p.category?._id || p.category,
      price: p.price, discountPrice: p.discountPrice || '',
      countInStock: p.countInStock, description: p.description,
      images: p.images || [''],
      colors: (p.colors || []).join(', '),
      sizes: (p.sizes || []).join(', '),
      isFeatured: p.isFeatured, isBestSeller: p.isBestSeller, isFlashSale: p.isFlashSale,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
        countInStock: Number(form.countInStock),
        colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
        images: form.images.filter(Boolean),
      };
      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Products</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>{total} total products</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Product</button>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <Search size={16} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products…" />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><Package size={48} /><h3>No products found</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th>
                  <th>Discount</th><th>Stock</th><th>Rating</th><th>Flags</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={p.images?.[0]} alt={p.name} className="product-img" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-muted">{p.category?.name || '—'}</span></td>
                    <td style={{ fontWeight: 700 }}>${p.price}</td>
                    <td>{p.discountPrice > 0 ? <span className="badge badge-danger">${p.discountPrice} ({p.discountPercentage}% off)</span> : '—'}</td>
                    <td>
                      <span className={`badge ${p.countInStock === 0 ? 'badge-danger' : p.countInStock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                        {p.countInStock}
                      </span>
                    </td>
                    <td>⭐ {p.rating} ({p.numReviews})</td>
                    <td style={{ fontSize: 11 }}>
                      {p.isFeatured && <span className="badge badge-accent" style={{ marginRight: 4 }}>Featured</span>}
                      {p.isBestSeller && <span className="badge badge-success" style={{ marginRight: 4 }}>Best Seller</span>}
                      {p.isFlashSale && <span className="badge badge-danger">Flash Sale</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(p._id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required />
                </div>
              </div>

              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Price</label>
                  <input type="number" min="0" step="0.01" value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} />
                </div>
              </div>

              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Stock Count *</label>
                  <input type="number" min="0" value={form.countInStock} onChange={e => setForm({ ...form, countInStock: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Colors (comma separated)</label>
                  <input value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} placeholder="Black, White, Blue" />
                </div>
              </div>

              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Sizes (comma separated)</label>
                  <input value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" />
                </div>
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input value={form.images[0]} onChange={e => setForm({ ...form, images: [e.target.value] })} placeholder="https://..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                {[['isFeatured', '⭐ Featured'], ['isBestSeller', '🔥 Best Seller'], ['isFlashSale', '⚡ Flash Sale']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} style={{ width: 16, height: 16 }} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editProduct ? 'Update Product' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h2 className="modal-title" style={{ marginBottom: 8 }}>Delete Product?</h2>
            <p className="text-muted">This action cannot be undone. The product will be permanently removed.</p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
