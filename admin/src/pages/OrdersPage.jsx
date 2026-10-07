import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, ChevronDown, Eye, X } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];

const statusBadge = (status) => {
  const map = {
    Pending: 'badge-warning', Confirmed: 'badge-info', Processing: 'badge-info',
    Shipped: 'badge-accent', 'Out for Delivery': 'badge-accent',
    Delivered: 'badge-success', Cancelled: 'badge-danger', Returned: 'badge-muted',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get('/orders/all', { params });
      setOrders(data.orders || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async () => {
    if (!newStatus) return;
    try {
      await api.put(`/orders/${selected._id}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      setSelected(null);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Orders</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>{total} total orders</p>
        </div>
      </div>

      <div className="filter-row">
        <div className="search-bar">
          <Search size={16} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or tracking…" />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ maxWidth: 180 }}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3>No orders found</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Items</th>
                  <th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>…{o._id.slice(-8)}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{o.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.user?.email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{o.orderItems?.length} item{o.orderItems?.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 700 }}>${o.totalPrice?.toFixed(2)}</td>
                    <td>{o.isPaid ? <span className="badge badge-success">Paid</span> : <span className="badge badge-warning">Unpaid</span>}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setSelected(o); setNewStatus(o.status); }}>
                        <Eye size={13} /> View
                      </button>
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

      {/* Order Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Order Details</h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>ID: {selected._id}</div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            {/* Items */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Order Items</div>
              {selected.orderItems?.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <img src={item.image} alt={item.name} className="product-img" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Color: {item.color} • Size: {item.size} • Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Shipping */}
            <div style={{ marginBottom: 20, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Shipping Address</div>
              <div style={{ fontSize: 13 }}>
                <strong>{selected.shippingAddress?.fullName}</strong><br />
                {selected.shippingAddress?.addressLine1}{selected.shippingAddress?.addressLine2 ? `, ${selected.shippingAddress.addressLine2}` : ''}<br />
                {selected.shippingAddress?.city}, {selected.shippingAddress?.state} {selected.shippingAddress?.postalCode}<br />
                {selected.shippingAddress?.country}
              </div>
            </div>

            {/* Price Summary */}
            <div style={{ marginBottom: 20, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              {[['Items Total', selected.itemsPrice], ['Shipping', selected.shippingPrice], ['Tax', selected.taxPrice], ['Discount', -selected.discountPrice]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  <span>{l}</span><span>{v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v?.toFixed(2)}`}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, marginTop: 8, borderTop: '1px solid var(--border-light)', paddingTop: 8 }}>
                <span>Total</span><span style={{ color: 'var(--accent)' }}>${selected.totalPrice?.toFixed(2)}</span>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <label className="form-label">Update Order Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ flex: 1 }}>
                  {STATUS_OPTIONS.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-primary" onClick={updateStatus}>Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
