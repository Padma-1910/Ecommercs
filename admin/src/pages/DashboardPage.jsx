import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, ShoppingCart, Users, Package,
  Clock, CheckCircle, AlertTriangle, TrendingUp
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' && p.name !== 'Orders' ? `$${p.value.toFixed(0)}` : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ label, value, icon: Icon, gradient, change, prefix = '' }) => (
  <div className="stat-card">
    <div className="stat-card-icon" style={{ background: gradient }}>
      <Icon size={20} color="white" />
    </div>
    <div className="stat-card-value">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</div>
    <div className="stat-card-label">{label}</div>
    {change !== undefined && (
      <div className={`stat-card-change ${change >= 0 ? 'up' : 'down'}`}>
        <TrendingUp size={12} />
        {Math.abs(change)}% from last month
      </div>
    )}
  </div>
);

const orderStatusBadge = (status) => {
  const map = {
    Pending: 'badge-warning', Confirmed: 'badge-info', Processing: 'badge-info',
    Shipped: 'badge-accent', 'Out for Delivery': 'badge-accent',
    Delivered: 'badge-success', Cancelled: 'badge-danger', Returned: 'badge-muted',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>;
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /><span>Loading dashboard…</span></div>;
  if (!data) return <div className="content"><p>Could not load dashboard. Make sure the backend is running.</p></div>;

  const { stats, dailySales, monthlySales, recentOrders, bestSellers, lowStockProducts } = data;

  return (
    <div className="content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Dashboard</h1>
        <p className="text-muted text-sm" style={{ marginTop: 4 }}>Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Revenue" value={stats.totalRevenue.toFixed(2)} icon={DollarSign} gradient="var(--gradient-1)" prefix="$" change={12} />
        <StatCard label="Total Orders" value={stats.totalOrders} icon={ShoppingCart} gradient="var(--gradient-4)" change={8} />
        <StatCard label="Total Customers" value={stats.totalCustomers} icon={Users} gradient="var(--gradient-2)" change={5} />
        <StatCard label="Total Products" value={stats.totalProducts} icon={Package} gradient="var(--gradient-3)" />
        <StatCard label="Pending Orders" value={stats.pendingOrders} icon={Clock} gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
        <StatCard label="Delivered Orders" value={stats.deliveredOrders} icon={CheckCircle} gradient="linear-gradient(135deg,#22c55e,#16a34a)" />
        <StatCard label="Low Stock Items" value={stats.lowStockCount} icon={AlertTriangle} gradient="linear-gradient(135deg,#ef4444,#dc2626)" />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue (Last 7 Days)</div>
              <div className="card-subtitle text-muted">Daily sales overview</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailySales}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="totalSales" stroke="#6c63ff" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Orders (Last 6 Months)</div>
              <div className="card-subtitle text-muted">Monthly order count</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orderCount" fill="#a855f7" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Orders</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>…{order._id.slice(-6)}</td>
                    <td>{order.user?.name || 'Guest'}</td>
                    <td style={{ fontWeight: 700 }}>${order.totalPrice?.toFixed(2)}</td>
                    <td>{orderStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Best Sellers</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bestSellers.map((p, i) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <img src={p.images?.[0]} alt={p.name} className="product-img" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand} • ⭐ {p.rating}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>${p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock */}
      {lowStockProducts.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">⚠️ Low Stock Alerts</div>
              <div className="card-subtitle text-muted">Products with 10 or fewer units remaining</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Product</th><th>Brand</th><th>Price</th><th>Stock</th></tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={p.images?.[0]} alt={p.name} className="product-img" />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{p.brand}</td>
                    <td>${p.price}</td>
                    <td><span className={`badge ${p.countInStock === 0 ? 'badge-danger' : 'badge-warning'}`}>{p.countInStock} left</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
