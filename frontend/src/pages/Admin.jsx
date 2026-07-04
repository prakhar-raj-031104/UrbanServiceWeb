import { useEffect, useState, useCallback } from 'react';
import { api, API_BASE } from '../lib/api.js';

const STATUS_FILTERS = ['', 'PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('urban_admin_token') || '');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('');
  const [staffByService, setStaffByService] = useState({});
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.admin.stats(token), api.admin.requests(token, filter)]);
      setStats(s);
      setRequests(r.requests);
      setAuthed(true);
      setError('');
    } catch (err) {
      setError(err.message);
      setAuthed(false);
    }
  }, [token, filter]);

  const login = async (e) => {
    e.preventDefault();
    localStorage.setItem('urban_admin_token', token);
    await refresh();
  };

  useEffect(() => {
    if (localStorage.getItem('urban_admin_token')) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // auto-poll every 10s as a fallback
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [authed, refresh]);

  // live push: SSE stream — new requests appear instantly with a toast
  useEffect(() => {
    if (!authed) return;
    const es = new EventSource(`${API_BASE}/admin/events?token=${encodeURIComponent(token)}`);
    es.addEventListener('request:new', (e) => {
      const r = JSON.parse(e.data);
      setToasts((t) => [...t, { id: r.id, code: r.code, text: `${r.serviceName} — ${r.customerName}` }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== r.id)), 6000);
      refresh();
    });
    return () => es.close();
  }, [authed, token, refresh]);

  const loadStaff = async (serviceId) => {
    if (staffByService[serviceId]) return;
    const d = await api.admin.staff(token, serviceId);
    setStaffByService((m) => ({ ...m, [serviceId]: d.staff }));
  };

  const act = async (fn) => {
    try {
      await fn();
      await refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!authed) {
    return (
      <main className="page">
        <div className="container admin__login">
          <div className="card admin__loginCard">
            <span className="pill">Admin</span>
            <h2>Admin Panel</h2>
            <p className="muted">Enter the admin token to manage requests.</p>
            <form onSubmit={login} className="form">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Admin token"
              />
              {error && <div className="form__error">{error}</div>}
              <button className="btn btn-blue">Sign in →</button>
            </form>
            <p className="form__note">Default dev token is in <code>backend/.env</code> (ADMIN_TOKEN).</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page admin">
      <div className="toasts">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <b>🔔 New request {t.code}</b>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      <div className="container">
        <div className="row spread center admin__head">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1 className="page__title" style={{ fontSize: 36 }}>Service Requests</h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={refresh}>↻ Refresh</button>
        </div>

        {stats && (
          <div className="grid admin__stats">
            <Stat label="Pending" value={stats.pending} tone="amber" />
            <Stat label="In progress" value={stats.inProgress} tone="blue" />
            <Stat label="Completed" value={stats.completed} tone="green" />
            <Stat label="Staff available" value={stats.availableStaff} tone="ink" />
          </div>
        )}

        <div className="admin__filters">
          {STATUS_FILTERS.map((f) => (
            <button key={f} className={`chip ${filter === f ? 'chip--on' : ''}`} onClick={() => setFilter(f)}>
              {f || 'All'}
            </button>
          ))}
        </div>

        <div className="admin__list">
          {requests.map((r) => (
            <RequestRow key={r.id} r={r} onLoadStaff={loadStaff} staff={staffByService[r.serviceId] || []} act={act} token={token} />
          ))}
          {requests.length === 0 && <div className="empty">No requests in this view.</div>}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`card statcard statcard--${tone}`}>
      <div className="stat-num">{value}</div>
      <span>{label}</span>
    </div>
  );
}

function RequestRow({ r, onLoadStaff, staff, act, token }) {
  const [selStaff, setSelStaff] = useState('');

  return (
    <div className="card reqrow">
      <div className="reqrow__main">
        <div className="reqrow__top">
          <span className="pill">{r.service.category}</span>
          <span className={`status status--${r.status}`}>{r.status}</span>
          <b className="code">{r.code}</b>
        </div>
        <h3>{r.service.name}</h3>
        <div className="reqrow__meta">
          <span>👤 {r.customerName}</span>
          <span>📞 {r.customerPhone}</span>
          <span>📍 {r.address}</span>
          {r.scheduledFor && <span>🗓 {new Date(r.scheduledFor).toLocaleString()}</span>}
        </div>
        {r.notes && <p className="muted">“{r.notes}”</p>}

        {r.staff && (
          <div className="reqrow__staff">
            <img src={r.staff.photoUrl} alt={r.staff.name} />
            <span><b>{r.staff.name}</b> · {r.staff.phone}</span>
          </div>
        )}

        <div className="reqrow__times">
          {r.startedAt && <span>▶ Started {new Date(r.startedAt).toLocaleTimeString()}</span>}
          {r.completedAt && <span>✓ Done {new Date(r.completedAt).toLocaleTimeString()}</span>}
          {r.durationMins != null && <span>⏱ {r.durationMins} min</span>}
          {r.estimatedCost != null && <span className="accent"><b>₹{r.estimatedCost}</b></span>}
        </div>
      </div>

      <div className="reqrow__actions">
        {r.status === 'PENDING' && (
          <button className="btn btn-blue btn-sm" onClick={() => act(() => api.admin.accept(token, r.id))}>Accept</button>
        )}
        {(r.status === 'ACCEPTED' || r.status === 'ASSIGNED') && (
          <div className="assign">
            <select
              value={selStaff}
              onFocus={() => onLoadStaff(r.serviceId)}
              onChange={(e) => setSelStaff(e.target.value)}
            >
              <option value="">Assign staff…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id} disabled={!s.isAvailable}>
                  {s.name} {s.isAvailable ? `(${s.rating}★)` : '(busy)'}
                </option>
              ))}
            </select>
            <button
              className="btn btn-dark btn-sm"
              disabled={!selStaff}
              onClick={() => act(() => api.admin.assign(token, r.id, selStaff))}
            >
              {r.status === 'ASSIGNED' ? 'Reassign' : 'Assign'}
            </button>
          </div>
        )}
        {r.status === 'ASSIGNED' && (
          <button className="btn btn-blue btn-sm" onClick={() => act(() => api.admin.start(token, r.id))}>▶ Mark Started</button>
        )}
        {r.status === 'IN_PROGRESS' && (
          <button className="btn btn-blue btn-sm" onClick={() => act(() => api.admin.complete(token, r.id))}>✓ Complete & Bill</button>
        )}
        {r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && (
          <button className="btn btn-ghost btn-sm" onClick={() => act(() => api.admin.cancel(token, r.id))}>Cancel</button>
        )}
      </div>
    </div>
  );
}
