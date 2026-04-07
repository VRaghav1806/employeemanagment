import React, { useState } from 'react';

export function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    onLogin({ email, password }, setStatus);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to access the manager / employee dashboard.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-full" type="submit">
            Sign in
          </button>
        </form>
        {status && (
          <div
            className={
              status.type === 'error'
                ? 'status-text error'
                : status.type === 'success'
                ? 'status-text ok'
                : 'status-text'
            }
          >
            {status.message}
          </div>
        )}
        <p style={{ marginTop: 12, fontSize: 11, color: '#8a8fa3' }}>
          Tip: first create a manager via POST <code>/api/auth/seed-manager</code> using Postman or any REST client.
        </p>
      </div>
    </div>
  );
}

