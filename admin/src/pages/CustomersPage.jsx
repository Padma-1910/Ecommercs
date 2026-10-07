import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, UserX, UserCheck, Eye, X } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/admin/customers', { params });
      setCustomers(data.customers || []);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const toggleStatus = async (customer) => {
    const newStatus = customer.status === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/admin/customers/${customer._id}/status`, { status: newStatus });
      toast.success(`Account ${newStatus === 'suspended' ? 'suspended' : 'activated'}`);
      fetchCustomers();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Customers</h1>
        <p className="text-muted text-sm" style={{ marginTop: 4 }}>{customers.length} registered customers</p>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <Search size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={c.avatar} alt={c.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.email}</td>
                    <td style={{ fontWeight: 600 }}>{c.orderCount}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>${c.totalSpent?.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelected(c)}><Eye size={13} /></button>
                        <button
                          className={`btn btn-sm ${c.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleStatus(c)}
                          title={c.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          {c.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Customer Profile</h2>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src={selected.avatar} alt={selected.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', marginBottom: 10 }} />
              <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.email}</div>
              <span className={`badge ${selected.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: 8, display: 'inline-flex' }}>{selected.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['📦 Orders', selected.orderCount],
                ['💰 Total Spent', `$${selected.totalSpent?.toFixed(2)}`],
                ['📞 Phone', selected.phone || '—'],
                ['📅 Joined', new Date(selected.createdAt).toLocaleDateString()],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
