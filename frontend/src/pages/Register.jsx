import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
    if (name === 'password') calculatePasswordStrength(value);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await register(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-register">
      <section className="auth-intro" aria-labelledby="auth-intro-title">
        <img className="product-logo" src="/xzoom-logo.svg" alt="XZoom" />

        <div className="auth-pitch">
          <p className="ui-eyebrow">One account, simple meetings</p>
          <h1 id="auth-intro-title">Your meeting room is <span>ready when you are.</span></h1>
          <p>Create an account to start meetings and keep a list of the meetings you create.</p>
        </div>

        <p className="auth-capabilities">Create · Join · Meet</p>
      </section>

      <main className="auth-form-panel">
        <div className="auth-form-wrap">
          <p className="ui-eyebrow">Get started</p>
          <h2>Create your account</h2>
          <p className="auth-form-description">
            Already registered? <Link to="/login">Sign in</Link>
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="form-alert" role="alert">{error}</div>}

            <div className="form-field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <span>At least 6 characters</span>
              </div>
              <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" value={formData.password} onChange={handleChange} required />
              {formData.password && (
                <div className="password-strength" aria-live="polite">
                  <div className="strength-track"><span data-strength={passwordStrength} style={{ width: `${Math.max(10, (passwordStrength / 5) * 100)}%` }} /></div>
                  <span>{getPasswordStrengthText()}</span>
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" value={formData.confirmPassword} onChange={handleChange} required />
            </div>

            <button className="primary-action" type="submit" disabled={loading}>
              {loading ? <><span className="button-spinner" aria-hidden="true" />Creating account…</> : 'Create account'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
