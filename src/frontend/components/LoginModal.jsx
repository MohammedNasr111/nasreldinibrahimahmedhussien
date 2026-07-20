import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';

export default function LoginModal({ open, onClose }) {
  const { login } = useAuth();
  const { showToast } = useContent();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      setPassword('');
      onClose();
      showToast('Logged in — edit mode enabled');
    } catch {
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="modal-title">Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-gold" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
