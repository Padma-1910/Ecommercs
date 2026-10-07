import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: 'admin@shopflow.com', password: 'Admin@1234' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back, Admin!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🛒</div>
          <h1 className="auth-title">ShopFlow Admin</h1>
          <p className="auth-subtitle">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="email"
                style={{ paddingLeft: 38 }}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@shopflow.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={showPw ? 'text' : 'password'}
                style={{ paddingLeft: 38, paddingRight: 38 }}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Demo Credentials</div>
          <div style={{ color: 'var(--text-secondary)' }}>📧 admin@shopflow.com</div>
          <div style={{ color: 'var(--text-secondary)' }}>🔑 Admin@1234</div>
          <div style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 11 }}>Run <code style={{ color: 'var(--accent)' }}>npm run seed</code> in /backend first</div>
        </div>
      </div>
    </div>
  );
}
