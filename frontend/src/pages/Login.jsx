import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-intro" aria-labelledby="auth-intro-title">
        <img className="product-logo" src="/xzoom-logo.svg" alt="XZoom" />

        <div className="auth-pitch">
          <p className="ui-eyebrow">Browser-based video meetings</p>
          <h1 id="auth-intro-title">Meet, share, and chat <span>in one room.</span></h1>
          <p>Create a meeting, share its code, and talk with your team from the browser.</p>
        </div>

        <p className="auth-capabilities">Video and audio ? Screen sharing ? Meeting chat</p>
      </section>

      <main className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="ui-eyebrow">Welcome back</p>
          <h2>Sign in to XZoom</h2>
          <p className="auth-form-description">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="form-alert" role="alert">{error}</div>}

            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button className="primary-action" type="submit" disabled={loading}>
              {loading ? <><span className="button-spinner" aria-hidden="true" />Signing in?</> : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
