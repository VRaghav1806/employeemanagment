const API_BASE = 'http://localhost:5000/api';

let authState = {
  token: null,
  user: null
};

function setAuthState(newState) {
  authState = { ...authState, ...newState };
  render();
}

async function apiRequest(path, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {},
    authState.token ? { Authorization: 'Bearer ' + authState.token } : {}
  );
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const statusEl = document.getElementById('auth-status');
  statusEl.textContent = 'Signing in...';
  statusEl.className = 'status-text';

  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthState({ token: result.token, user: result.user });
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = 'status-text error';
  }
}

async function handleCreateEmployeeSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const statusEl = document.getElementById('employee-status');
  statusEl.textContent = 'Creating employee...';
  statusEl.className = 'status-text';

  try {
    await apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    form.reset();
    statusEl.textContent = 'Employee created successfully';
    statusEl.className = 'status-text ok';
    await loadEmployees();
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = 'status-text error';
  }
}

let employeesCache = [];

async function loadEmployees() {
  if (!authState.token) return;
  try {
    const employees = await apiRequest('/employees');
    employeesCache = employees;
    renderEmployees();
  } catch (err) {
    console.error(err);
  }
}

function renderEmployees() {
  const container = document.getElementById('employee-list');
  if (!container) return;
  const rows = employeesCache
    .map(
      (e) =>
        `<div class="employee-row"><div>${e.name}</div><div>${e.email}</div><div><span class="pill-role">Employee</span></div></div>`
    )
    .join('');
  container.innerHTML =
    '<div class="employee-row header"><div>Name</div><div>Email</div><div>Role</div></div>' +
    rows;
}

function logout() {
  setAuthState({ token: null, user: null });
}

function renderLogin() {
  return `
    <div class="auth-shell">
      <div class="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to access the manager / employee dashboard.</p>
        <form id="login-form">
          <div class="form-field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@company.com" required />
          </div>
          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <button class="btn btn-primary btn-full" type="submit">Sign in</button>
        </form>
        <div id="auth-status" class="status-text"></div>
        <p style="margin-top:12px;font-size:11px;color:#8a8fa3;">
          Tip: first create a manager via POST <code>/api/auth/seed-manager</code> using Postman or any REST client.
        </p>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const role = authState.user?.role || '';
  const name = authState.user?.name || '';

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div>
          <div class="sidebar-logo">
            <div class="sidebar-logo-circle"></div>
            <div class="sidebar-logo-text">MyLogo</div>
          </div>
          <div class="sidebar-user">
            Signed in as <strong>${name || 'User'}</strong><br/>
            Role: ${role === 'manager' ? 'Manager' : 'Employee'}
          </div>
          <ul class="sidebar-nav">
            <li class="active"><span class="dot"></span> Dashboard</li>
            <li>Employees</li>
            <li>Reports</li>
            <li>Settings</li>
          </ul>
        </div>
        <div class="sidebar-footer">© 2026 Company</div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="topbar-left">
            <div class="search-box">Search...</div>
          </div>
          <div class="topbar-actions">
            <div class="pill-badge">Notifications</div>
            <button class="logout-btn" id="logout-btn">Log Out</button>
          </div>
        </header>
        <section class="content">
          <div class="content-header">
            <h1>Aliquam nec quam</h1>
            <p>Overview of your team and employee activity.</p>
          </div>
          <div class="grid">
            <div class="grid-left">
              <div class="card">
                <div class="card-header">
                  <h2>Total employees</h2>
                  <span>Manager view</span>
                </div>
                <div class="metric-value">${employeesCache.length.toString().padStart(3, '0')}</div>
                <div class="metric-sub">Active employees in the system</div>
              </div>
            </div>
            <div class="grid-right">
              <div class="card calendar">
                <div class="calendar-header">
                  <span>April</span>
                  <span>2026</span>
                </div>
                <div class="calendar-grid">
                  ${['S','M','T','W','T','F','S'].map(d => `<div class="calendar-cell day-name">${d}</div>`).join('')}
                  ${Array.from({ length: 30 }).map((_, i) => {
                    const day = i + 1;
                    const extraClass = day === 6 ? 'calendar-cell active' : 'calendar-cell';
                    return `<div class="${extraClass}">${day}</div>`;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>

          ${
            role === 'manager'
              ? `
          <div style="margin-top:20px;display:grid;grid-template-columns:1.2fr 1.6fr;gap:18px;">
            <div class="card">
              <div class="card-header">
                <h2>Add employee</h2>
                <span class="tag dot">Manager only</span>
              </div>
              <form id="employee-form">
                <div class="form-field">
                  <label for="name">Name</label>
                  <input id="name" name="name" required placeholder="Employee name" />
                </div>
                <div class="form-field">
                  <label for="emp-email">Email</label>
                  <input id="emp-email" name="email" type="email" required placeholder="employee@company.com" />
                </div>
                <div class="form-field">
                  <label for="emp-password">Password</label>
                  <input id="emp-password" name="password" type="password" required placeholder="Temporary password" />
                </div>
                <button class="btn btn-primary" type="submit">Create employee</button>
                <div id="employee-status" class="status-text"></div>
              </form>
            </div>
            <div class="card">
              <div class="card-header">
                <h2>Employees</h2>
                <span>${employeesCache.length} total</span>
              </div>
              <div id="employee-list" class="employee-list"></div>
            </div>
          </div>`
              : `
          <div style="margin-top:20px;" class="card">
            <div class="card-header">
              <h2>Your profile</h2>
              <span>Employee view</span>
            </div>
            <p style="font-size:13px;color:#6b7280;">
              You are logged in as <strong>${name}</strong> with role <span class="pill-role">Employee</span>.
              Contact your manager to update your account details.
            </p>
          </div>`
          }
        </section>
      </main>
    </div>
  `;
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = authState.token ? renderDashboard() : renderLogin();

  if (!authState.token) {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', handleLoginSubmit);
    }
  } else {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
    if (authState.user?.role === 'manager') {
      const empForm = document.getElementById('employee-form');
      if (empForm) {
        empForm.addEventListener('submit', handleCreateEmployeeSubmit);
      }
      loadEmployees();
    }
  }
}

render();

