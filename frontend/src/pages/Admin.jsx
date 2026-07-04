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
  const [view, setView] = useState('requests'); // 'requests' | 'staff'

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
            <h1 className="page__title" style={{ fontSize: 36 }}>{view === 'staff' ? 'Staff Management' : 'Service Requests'}</h1>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className={`chip ${view === 'requests' ? 'chip--on' : ''}`} onClick={() => setView('requests')}>Requests</button>
            <button className={`chip ${view === 'staff' ? 'chip--on' : ''}`} onClick={() => setView('staff')}>Staff</button>
            <button className="btn btn-ghost btn-sm" onClick={refresh}>↻ Refresh</button>
          </div>
        </div>

        {view === 'staff' && <StaffPanel token={token} />}

        {view === 'requests' && stats && (
          <div className="grid admin__stats">
            <Stat label="Pending" value={stats.pending} tone="amber" />
            <Stat label="In progress" value={stats.inProgress} tone="blue" />
            <Stat label="Completed" value={stats.completed} tone="green" />
            <Stat label="Staff available" value={stats.availableStaff} tone="ink" />
          </div>
        )}

        {view === 'requests' && (
          <>
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
          </>
        )}
      </div>
    </main>
  );
}

// Resize an image file to a small square avatar and return a base64 data-URL.
function fileToAvatar(file, size = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const EMPTY_STAFF = { name: '', phone: '', gender: '', photoUrl: '', bio: '', serviceIds: [] };

function StaffPanel({ token }) {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  const load = useCallback(() => {
    api.admin.staff(token).then((d) => setStaff(d.staff)).catch(() => {});
    api.listServices().then((d) => setServices(d.services)).catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggleService = (id) =>
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
    }));

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToAvatar(file);
      setForm((f) => ({ ...f, photoUrl: dataUrl }));
    } catch {
      setMsg({ ok: '', err: 'Could not read that image' });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ ok: '', err: '' });
    try {
      await api.admin.createStaff(token, form);
      setForm(EMPTY_STAFF);
      setMsg({ ok: 'Staff member added ✓', err: '' });
      load();
    } catch (err) {
      setMsg({ ok: '', err: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvail = async (s) => {
    await api.admin.updateStaff(token, s.id, { isAvailable: !s.isAvailable });
    load();
  };

  const remove = async (s) => {
    if (!confirm(`Remove ${s.name}? Past requests keep their history.`)) return;
    await api.admin.deleteStaff(token, s.id);
    load();
  };

  return (
    <div className="staffpanel">
      {/* add form */}
      <form className="card staffform" onSubmit={submit}>
        <h3>Add staff member</h3>
        <div className="staffform__grid">
          <label>
            Full name *
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lakshmi N." />
          </label>
          <label>
            Mobile number *
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" />
          </label>
          <label>
            Gender
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select…</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Photo
            <input type="file" accept="image/*" onChange={onPhoto} />
          </label>
        </div>

        {form.photoUrl && (
          <div className="staffform__preview">
            <img src={form.photoUrl} alt="preview" />
            <button type="button" className="link" onClick={() => setForm({ ...form, photoUrl: '' })}>remove photo</button>
          </div>
        )}

        <label className="staffform__bio">
          Short bio (optional)
          <input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="e.g. Deep-cleaning specialist, 5 yrs experience" />
        </label>

        <div className="staffform__services">
          <span>Services they provide *</span>
          <div className="staffform__chips">
            {services.map((s) => (
              <button
                type="button"
                key={s.id}
                className={`chip ${form.serviceIds.includes(s.id) ? 'chip--on' : ''}`}
                onClick={() => toggleService(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {msg.err && <div className="form__error">{msg.err}</div>}
        {msg.ok && <div className="staffform__ok">{msg.ok}</div>}

        <button className="btn btn-blue" disabled={saving || form.serviceIds.length === 0}>
          {saving ? 'Saving…' : 'Add staff →'}
        </button>
      </form>

      {/* staff list */}
      <div className="staffgrid">
        {staff.map((s) => (
          <div className="card staffcard" key={s.id}>
            <div className="staffcard__head">
              <img src={s.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=e8ecff&color=2138e6`} alt={s.name} />
              <div>
                <h4>{s.name}</h4>
                <p className="muted">{[s.gender, s.phone].filter(Boolean).join(' · ')}</p>
                <p className="muted staffcard__meta">{s.rating}★ · {s.jobsDone} jobs</p>
              </div>
              <span className={`avail ${s.isAvailable ? 'ok' : 'no'}`}>
                <span className={`dot ${s.isAvailable ? 'on' : 'off'}`} />{s.isAvailable ? 'Available' : 'Busy'}
              </span>
            </div>
            {s.bio && <p className="staffcard__bio">{s.bio}</p>}
            <div className="staffcard__services">
              {s.services?.map((sv) => <span key={sv.id}>{sv.name}</span>)}
            </div>
            <div className="staffcard__actions">
              <button className="btn btn-ghost btn-sm" onClick={() => toggleAvail(s)}>
                {s.isAvailable ? 'Mark busy' : 'Mark available'}
              </button>
              <button className="btn btn-ghost btn-sm staffcard__del" onClick={() => remove(s)}>Delete</button>
            </div>
          </div>
        ))}
        {staff.length === 0 && <div className="empty">No staff yet — add your first member above.</div>}
      </div>
    </div>
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
