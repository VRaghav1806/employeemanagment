import React, { useState, useEffect } from 'react';
import { ManagerPanel } from './ManagerPanel.jsx';

function Calendar() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const today = now.getDate();

  const monthName = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="card calendar">
      <div className="card-header">
        <h2>{monthName}</h2>
        <span>{currentYear}</span>
      </div>
      <div className="calendar-grid">
        {days.map((d, index) => (
          <div key={`${d}-${index}`} className="calendar-cell day-name">
            {d}
          </div>
        ))}
        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell empty" />
        ))}
        {dates.map((day) => (
          <div
            key={day}
            className={day === today ? 'calendar-cell active' : 'calendar-cell'}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const day = time.toLocaleDateString('default', { weekday: 'long' });
  const date = time.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
  const clock = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="live-clock">
      <div className="live-clock-time">{clock}</div>
      <div className="live-clock-details">
        {day}, {date}
      </div>
    </div>
  );
}

function AttendanceCard() {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('employee-manager-auth'));
      if (!authData?.token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/status`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await res.json();
      setActiveSession(data);
    } catch (err) {
      console.error('Failed to fetch attendance status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleClockIn = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('employee-manager-auth'));
      if (!authData?.token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/clock-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
      }
    } catch (err) {
      console.error('Clock in failed', err);
    }
  };

  const handleClockOut = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('employee-manager-auth'));
      if (!authData?.token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/clock-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      if (res.ok) {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Clock out failed', err);
    }
  };

  if (loading) return (
    <div className="card attendance-card">
      <div className="card-header"><h2>Attendance</h2></div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading status...</p>
    </div>
  );

  return (
    <div className="card attendance-card">
      <div className="card-header">
        <h2>Attendance</h2>
        <div className={`attendance-status ${activeSession ? 'in' : 'out'}`}>
          <span className="status-dot"></span>
          {activeSession ? 'Working' : 'Not Clocked In'}
        </div>
      </div>
      
      {activeSession && (
        <div className="timer" style={{ borderStyle: 'solid', fontSize: '20px' }}>
          Started at {new Date(activeSession.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: activeSession ? 10 : 0 }}>
        {!activeSession ? (
          <button className="btn btn-primary btn-full" onClick={handleClockIn}>
            Clock In
          </button>
        ) : (
          <button className="btn btn-full" style={{ background: '#fecaca', color: '#dc2626' }} onClick={handleClockOut}>
            Clock Out
          </button>
        )}
      </div>
    </div>
  );
}

function TasksCard({ onUpdateStatus }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('employee-manager-auth'));
      if (!authData?.token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // Poll for new tasks every 30 seconds
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const next = currentStatus === 'todo' ? 'progress' : currentStatus === 'progress' ? 'done' : 'todo';
    
    // Optimistic update
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: next } : t));
    
    try {
      await onUpdateStatus(id, next);
    } catch (err) {
      // Revert on error
      fetchTasks();
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>My Tasks</h2>
        <span>{tasks.filter(t => t.status !== 'done').length} pending</span>
      </div>
      <div className="task-list">
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No tasks assigned yet.</p>
        ) : (
          tasks.map(task => (
            <div key={task._id} className="task-item" onClick={() => handleToggleStatus(task._id, task.status)} style={{ cursor: 'pointer' }}>
              <div className="task-info">
                <span className="task-title">{task.title}</span>
                <span className="task-desc">{task.description}</span>
              </div>
              <span className={`task-badge ${task.status}`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LeaveCard() {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Leave Management</h2>
        <button className="tag" style={{ border: 'none', cursor: 'pointer' }}>Request Leave</button>
      </div>
      <div className="leave-grid">
        <div className="leave-stat">
          <label>Sick Leave</label>
          <span>4 / 12</span>
        </div>
        <div className="leave-stat">
          <label>Annual Leave</label>
          <span>15 / 24</span>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ user }) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric', day: 'numeric'
  }) : 'March 15, 2026';

  return (
    <div className="profile-view">
      <div className="card profile-card-main">
        <div className="profile-avatar-large">{initials}</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <div className="tag" style={{ marginTop: 8 }}>{user.department || 'General'}</div>
        </div>
      </div>

      <div className="grid">
        <div className="grid-left" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h2>Personal Information</h2>
              <span>Profile details</span>
            </div>
            <div className="profile-details-grid">
              <div className="detail-item">
                <label>Full Name</label>
                <span>{user.name}</span>
              </div>
              <div className="detail-item">
                <label>Email Address</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-item">
                <label>Job Role</label>
                <span>{user.role === 'manager' ? 'Manager' : 'Employee'}</span>
              </div>
              <div className="detail-item">
                <label>Department</label>
                <span>{user.department || 'General'}</span>
              </div>
              <div className="detail-item">
                <label>Member Since</label>
                <span>{joinedDate}</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2>Account Settings</h2>
              <span>Preferences</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn" style={{ justifyContent: 'flex-start', background: '#f4f6fb', color: 'var(--text-main)', width: '100%' }}>
                Change Password
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', background: '#f4f6fb', color: 'var(--text-main)', width: '100%' }}>
                Notification Preferences
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid-right">
          <div className="card">
            <div className="card-header">
              <h2>Current Assignment</h2>
              <span>{user.department || 'General'}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              You are currently registered in the <strong>{user.department || 'General'}</strong> department. 
              Admin/Managers can reassign your department as needed.
            </p>
          </div>
          <Calendar />
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ user, employees, onLogout, onCreateEmployee, onAssignTask, onUpdateTaskStatus }) {
  const [activeView, setActiveView] = useState('dashboard');
  const role = user?.role ?? '';
  const name = user?.name ?? 'User';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <div className="sidebar-logo-circle" />
            <div className="sidebar-logo-text">Aether HR</div>
          </div>
          <div className="sidebar-user">
            Signed in as <strong>{name}</strong>
            <br />
            Role: {role === 'manager' ? 'Manager' : 'Employee'}
          </div>
          <ul className="sidebar-nav">
            <li 
              className={activeView === 'dashboard' ? 'active' : ''} 
              onClick={() => setActiveView('dashboard')}
            >
              <span className="dot" /> Dashboard
            </li>
            <li 
              className={activeView === 'profile' ? 'active' : ''} 
              onClick={() => setActiveView('profile')}
            >
              <span className="dot" style={{ backgroundColor: activeView === 'profile' ? '#4b6cff' : 'transparent' }} /> 
              {role === 'manager' ? 'Team' : 'Profile'}
            </li>
          </ul>
        </div>
        <div className="sidebar-footer">© 2026 Aether AI</div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <div className="search-box">Search...</div>
          </div>
          <div className="topbar-actions">
            <div className="pill-badge">Notifications</div>
            <button className="logout-btn" type="button" onClick={onLogout}>
              Log Out
            </button>
          </div>
        </header>

        <section className="content">
          <div className="content-header">
            {activeView === 'dashboard' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h1>{role === 'manager' ? 'Manager Dashboard' : 'Employee Hub'}</h1>
                  <p>Welcome back, {name}. {role === 'manager' ? 'Overview of your team activity.' : 'Here is your summary for today.'}</p>
                </div>
                <LiveClock />
              </div>
            ) : (
              <>
                <h1>My Profile</h1>
                <p>Manage your personal information and account settings.</p>
              </>
            )}
          </div>

          {activeView === 'dashboard' ? (
            role === 'manager' ? (
              <>
                <div className="grid">
                  <div className="grid-left">
                    <div className="card">
                      <div className="card-header">
                        <h2>Total employees</h2>
                        <span>Organizational view</span>
                      </div>
                      <div className="metric-value">
                        {employees.length.toString().padStart(3, '0')}
                      </div>
                      <div className="metric-sub">
                        Active employees in the system
                      </div>
                    </div>
                  </div>
                  <div className="grid-right">
                    <Calendar />
                  </div>
                </div>
                <ManagerPanel
                  employees={employees}
                  onCreateEmployee={onCreateEmployee}
                  onAssignTask={onAssignTask}
                />
              </>
            ) : (
              <div className="grid">
                <div className="grid-left">
                  <AttendanceCard />
                  <LeaveCard />
                </div>
                <div className="grid-right">
                  <TasksCard onUpdateStatus={onUpdateTaskStatus} />
                  <Calendar />
                </div>
              </div>
            )
          ) : (
            <ProfileView user={user} />
          )}
        </section>
      </main>
    </div>
  );
}



