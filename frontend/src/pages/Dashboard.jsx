import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const STEPS = ['PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
const STEP_LABEL = { PENDING: 'Requested', ACCEPTED: 'Accepted', ASSIGNED: 'Assigned', IN_PROGRESS: 'In progress', COMPLETED: 'Done' };
const STATUS_HEAD = {
  PENDING: 'Waiting for confirmation',
  ACCEPTED: 'Matching a professional…',
  ASSIGNED: 'Professional on the way',
  IN_PROGRESS: 'Work in progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
const CAT_EMOJI = { COOKING: '🍳', WASHING: '🧺', CLEANING: '✨', OTHER: '🛠️' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!user) { nav('/auth?next=/dashboard'); return; }
    const load = () => api.auth.myRequests().then((d) => setRequests(d.requests)).catch(() => {});
    load();
    const id = setInterval(load, 10000); // live: statuses update automatically
    return () => clearInterval(id);
  }, [user, nav]);

  if (!user) return null;

  const active = (requests || []).filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status));
  const history = (requests || []).filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));

  return (
    <main className="page dash">
      <div className="container">
        {/* profile head */}
        <div className="dash__head">
          <div className="dash__who">
            <span className="dash__avatar">{user.name[0]?.toUpperCase()}</span>
            <div>
              <span className="eyebrow">My dashboard</span>
              <h1>Hi, {user.name.split(' ')[0]} 👋</h1>
              <p className="muted">{user.phone} · {user.address}</p>
            </div>
          </div>
          <div className="dash__actions">
            <Link to="/services" className="btn btn-blue btn-sm">+ Book a service</Link>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); nav('/'); }}>Log out</button>
          </div>
        </div>

        {requests === null && <div className="empty">Loading your requests…</div>}

        {/* active requests */}
        {requests !== null && (
          <>
            <h3 className="dash__sectiontitle">Active requests {active.length > 0 && <em>· updates live</em>}</h3>
            {active.length === 0 && (
              <div className="dash__empty card">
                <p>No active requests. Need a hand at home?</p>
                <Link to="/services" className="btn btn-blue btn-sm">Browse services →</Link>
              </div>
            )}
            <div className="dash__list">
              {active.map((r) => <RequestCard key={r.id} r={r} />)}
            </div>

            {/* history */}
            {history.length > 0 && (
              <>
                <h3 className="dash__sectiontitle" style={{ marginTop: 46 }}>History</h3>
                <div className="dash__list">
                  {history.map((r) => <RequestCard key={r.id} r={r} compact />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function RequestCard({ r, compact }) {
  const [open, setOpen] = useState(false);
  const idx = STEPS.indexOf(r.status);
  const cancelled = r.status === 'CANCELLED';

  return (
    <div className={`card dashreq ${compact ? 'dashreq--compact' : ''}`}>
      <div className="dashreq__main">
        <div className="dashreq__icon">{CAT_EMOJI[r.service.category] || '🛠️'}</div>
        <div className="dashreq__info">
          <div className="dashreq__toprow">
            <h4>{r.service.name}</h4>
            <b className="code">{r.code}</b>
            <span className={`status status--${r.status}`}>{STATUS_HEAD[r.status]}</span>
          </div>
          <p className="muted dashreq__meta">
            Requested {new Date(r.createdAt).toLocaleString()}
            {r.scheduledFor && <> · scheduled {new Date(r.scheduledFor).toLocaleString()}</>}
            {r.estimatedCost != null && <> · <b className="accent">₹{r.estimatedCost}</b> ({r.durationMins} min)</>}
          </p>

          {/* mini progress stepper */}
          {!cancelled && !compact && (
            <div className="ministep">
              {STEPS.map((s, i) => (
                <div key={s} className={`ministep__s ${i <= idx ? 'on' : ''} ${i === idx ? 'now' : ''}`}>
                  <span className="ministep__dot" />
                  <span className="ministep__lbl">{STEP_LABEL[s]}</span>
                </div>
              ))}
              <div className="ministep__bar"><div style={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }} /></div>
            </div>
          )}

          {/* assigned professional */}
          {r.staff && !compact && (
            <div className="dashreq__staff">
              <img src={r.staff.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.staff.name)}&background=e8ecff&color=2138e6`} alt={r.staff.name} />
              <span><b>{r.staff.name}</b> · {r.staff.rating}★</span>
              <a className="btn btn-ghost btn-sm" href={`tel:${r.staff.phone}`}>📞 Call</a>
            </div>
          )}
        </div>
      </div>

      {/* expandable timeline */}
      <button className="dashreq__toggle" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide timeline ▲' : 'View timeline ▼'}
      </button>
      {open && (
        <ul className="dashreq__timeline">
          {[...r.events].reverse().map((ev) => (
            <li key={ev.id}>
              <b>{ev.type}</b>
              <p>{ev.message}</p>
              <small>{new Date(ev.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
