import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Tag, BarChart2, Settings, LogOut, Ticket, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { label: 'Overview', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  ]},
  { label: 'Catalog', items: [
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    { to: '/coupons', icon: Ticket, label: 'Coupons' },
  ]},
  { label: 'Users', items: [
    { to: '/customers', icon: Users, label: 'Customers' },
  ]},
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🛒</div>
        <span className="sidebar-logo-text">ShopFlow</span>
        <span className="sidebar-logo-badge">ADMIN</span>
      </div>

      <nav className="sidebar-nav">
        {nav.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-badge">
          <div className="admin-avatar">{initials}</div>
          <div className="admin-info">
            <div className="admin-name">{user?.name || 'Admin'}</div>
            <div className="admin-role">Administrator</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout" style={{ padding: '6px' }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
