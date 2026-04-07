import React, { useEffect, useState } from 'react';
import { Login } from './components/Login.jsx';
import { Dashboard } from './components/Dashboard.jsx';

const API_BASE = '/api';

async function apiRequest(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export default function App() {
  const [auth, setAuth] = useState({ token: null, user: null });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const stored = window.localStorage.getItem('employee-manager-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.user) {
          setAuth(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (auth.token && auth.user) {
      window.localStorage.setItem('employee-manager-auth', JSON.stringify(auth));
    } else {
      window.localStorage.removeItem('employee-manager-auth');
    }
  }, [auth]);

  useEffect(() => {
    if (!auth.token) return;
    if (auth.user?.role !== 'manager') {
      setEmployees([]);
      return;
    }
    void loadEmployees();
  }, [auth.token, auth.user?.role]);

  async function loadEmployees() {
    try {
      const data = await apiRequest('/employees', {}, auth.token);
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogin(credentials, setStatus) {
    setStatus({ type: 'info', message: 'Signing in...' });
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      setAuth({ token: result.token, user: result.user });
      setStatus(null);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function handleCreateEmployee(payload, setStatus, resetForm) {
    setStatus({ type: 'info', message: 'Creating employee...' });
    try {
      await apiRequest(
        '/employees',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        auth.token
      );
      setStatus({ type: 'success', message: 'Employee created successfully' });
      resetForm();
      await loadEmployees();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function handleAssignTask(payload, setStatus, resetForm) {
    setStatus({ type: 'info', message: 'Assigning task...' });
    try {
      await apiRequest(
        '/tasks',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        auth.token
      );
      setStatus({ type: 'success', message: 'Task assigned successfully' });
      resetForm();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  }

  async function updateTaskStatus(taskId, status) {
    try {
      await apiRequest(
        `/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status })
        },
        auth.token
      );
    } catch (err) {
      console.error(err);
    }
  }

  function handleLogout() {
    setAuth({ token: null, user: null });
  }

  if (!auth.token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={auth.user}
      employees={employees}
      onLogout={handleLogout}
      onCreateEmployee={handleCreateEmployee}
      onAssignTask={handleAssignTask}
      onUpdateTaskStatus={updateTaskStatus}
    />
  );
}

