import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const EMPTY_CAT = { name: '', description: '', image: '', icon: 'tag' };
const EMPTY_COUPON = {
  code: '', discountType: 'percentage', discountValue: '',
  minOrderValue: 0, maxDiscount: 100, expiryDate: '', usageLimit: 100, isActive: true,
};

function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState(EMPTY_CAT);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditCat(null); setForm(EMPTY_CAT); setModalOpen(true); };
  const openEdit = (c) => { setEditCat(c); setForm({ name: c.name, description: c.description, image: c.image, icon: c.icon }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCat) { await api.put(`/categories/${editCat._id}`, form); toast.success('Category updated!'); }
      else { await api.post('/categories', form); toast.success('Category created!'); }
      setModalOpen(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title">Categories</div><div className="text-muted text-sm">{categories.length} categories</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add</button>
      </div>
      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {categories.map(c => (
            <div key={c._id} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 14, position: 'relative' }}>
              {c.image && <img src={c.image} alt={c.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />}
              <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{c.description || 'No description'}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}><Edit2 size={12} /></button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c._id)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editCat ? 'Edit Category' : 'Add Category'}</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Image URL</label><input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></div>
              <div className="form-group"><label className="form-label">Icon Name</label><input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="tag" /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CouponsSection() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [form, setForm] = useState(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/coupons').then(r => setCoupons(r.data.coupons || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditCoupon(null); setForm(EMPTY_COUPON); setModalOpen(true); };
  const openEdit = (c) => {
    setEditCoupon(c);
    setForm({
      code: c.code, discountType: c.discountType, discountValue: c.discountValue,
      minOrderValue: c.minOrderValue, maxDiscount: c.maxDiscount,
      expiryDate: c.expiryDate?.split('T')[0] || '', usageLimit: c.usageLimit, isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCoupon) { await api.put(`/coupons/${editCoupon._id}`, form); toast.success('Coupon updated!'); }
      else { await api.post('/coupons', form); toast.success('Coupon created!'); }
      setModalOpen(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try { await api.delete(`/coupons/${id}`); toast.success('Coupon deleted'); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title">Coupons</div><div className="text-muted text-sm">{coupons.length} coupons</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add</button>
      </div>
      {loading ? <div className="spinner" /> : coupons.length === 0 ? <div className="empty-state"><h3>No coupons yet</h3></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c._id}>
                  <td><code style={{ color: 'var(--accent)', fontWeight: 700 }}>{c.code}</code></td>
                  <td><span className="badge badge-muted">{c.discountType}</span></td>
                  <td style={{ fontWeight: 700 }}>{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                  <td>${c.minOrderValue}</td>
                  <td>{c.usedCount}/{c.usageLimit}</td>
                  <td style={{ fontSize: 12, color: new Date(c.expiryDate) < new Date() ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {new Date(c.expiryDate).toLocaleDateString()}
                  </td>
                  <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c._id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label">Code *</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" required /></div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label">Discount Value *</label><input type="number" min="1" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Min Order Value ($)</label><input type="number" min="0" value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })} /></div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label">Max Discount ($)</label><input type="number" min="0" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Usage Limit</label><input type="number" min="1" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Expiry Date *</label><input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} required /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Coupon'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <div className="content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Catalog Management</h1>
        <p className="text-muted text-sm" style={{ marginTop: 4 }}>Manage product categories and discount coupons</p>
      </div>
      <CategoriesSection />
      <CouponsSection />
    </div>
  );
}
