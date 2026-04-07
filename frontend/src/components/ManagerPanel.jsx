import React, { useState, useEffect } from 'react';

export function ManagerPanel({ employees, onCreateEmployee, onAssignTask }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState(null);

  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [taskStatus, setTaskStatus] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('employee-manager-auth'));
      if (!authData?.token) return;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      const data = await res.json();
      setAttendanceLogs(data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLogsLoading(false);
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    onCreateEmployee(
      { name, email, password, department },
      setStatus,
      () => {
        setName('');
        setEmail('');
        setPassword('');
        setDepartment('');
      }
    );
  }

  function handleAssignTask(e) {
    e.preventDefault();
    if (!assignedTo) return;
    onAssignTask(
      { title: taskTitle, description: taskDesc, assignedTo },
      setTaskStatus,
      () => {
        setTaskTitle('');
        setTaskDesc('');
        setAssignedTo('');
      }
    );
  }

  return (
    <div
      style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
        gap: 18
      }}
    >
      <div className="card">
        <div className="card-header">
          <h2>Add employee</h2>
          <span className="tag dot">Manager only</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="emp-name">Name</label>
            <input
              id="emp-name"
              name="name"
              required
              placeholder="Employee name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="emp-email">Email</label>
            <input
              id="emp-email"
              name="email"
              type="email"
              required
              placeholder="employee@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="emp-dept">Department</label>
            <input
              id="emp-dept"
              name="department"
              required
              placeholder="e.g. Engineering"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="emp-password">Password</label>
            <input
              id="emp-password"
              name="password"
              type="password"
              required
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Create employee
          </button>
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
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card">
          <div className="card-header">
            <h2>Assign New Task</h2>
            <span>Direct assignment</span>
          </div>
          <form onSubmit={handleAssignTask}>
            <div className="form-field">
              <label>Select Employee</label>
              <select 
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
              >
                <option value="">Choose an employee...</option>
                {employees.map(e => (
                  <option key={e._id} value={e._id}>{e.name} ({e.department || 'General'})</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Task Title</label>
              <input 
                placeholder="e.g. Update Documentation"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Description</label>
              <textarea 
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5f5', fontSize: '13px' }}
                placeholder="Details of the task..."
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit">Assign Task</button>
            {taskStatus && (
              <div className={`status-text ${taskStatus.type === 'success' ? 'ok' : 'error'}`}>
                {taskStatus.message}
              </div>
            )}
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Employees</h2>
            <span>{employees.length} total</span>
          </div>
          <div className="employee-list">
            <div className="employee-row header">
              <div>Name</div>
              <div>Department</div>
              <div>Role</div>
            </div>
            {employees.map((e) => (
              <div key={e._id} className="employee-row">
                <div>{e.name}</div>
                <div>{e.department || 'General'}</div>
                <div>
                  <span className="pill-role">Employee</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Today's Attendance Logs</h2>
            <span>Daily Activity</span>
          </div>
          <div className="employee-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div className="employee-row header" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>Employee</div>
              <div>Clock In</div>
              <div>Clock Out</div>
            </div>
            {logsLoading ? (
              <p style={{ padding: 10, fontSize: 13 }}>Loading logs...</p>
            ) : attendanceLogs.length === 0 ? (
              <p style={{ padding: 10, fontSize: 13 }}>No logs found.</p>
            ) : (
              attendanceLogs.map((log) => (
                <div key={log._id} className="employee-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div style={{ fontSize: 12 }}>
                    <strong>{log.userId?.name}</strong>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{log.userId?.department}</div>
                  </div>
                  <div style={{ fontSize: 11 }}>
                    {new Date(log.clockIn).toLocaleDateString()}<br/>
                    {new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 11 }}>
                    {log.clockOut ? (
                      <>
                        {new Date(log.clockOut).toLocaleDateString()}<br/>
                        {new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : (
                      <span className="tag dot" style={{ background: '#dcfce7', color: '#166534' }}>Active</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

