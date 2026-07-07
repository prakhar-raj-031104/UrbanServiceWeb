import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
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
  const rootRef = useRef(null);
  const animated = useRef(false);

  const load = () => api.auth.myRequests().then((d) => setRequests(d.requests)).catch(() => {});

  useEffect(() => {
    if (!user) { nav('/auth?next=/dashboard'); return; }
    load();
    const id = setInterval(load, 10000); // live: statuses update automatically
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, nav]);

  // entrance: hero band + cards rise in once data arrives
  useEffect(() => {
    if (requests === null || animated.current || !rootRef.current) return;
    animated.current = true;
    const els = rootRef.current.querySelectorAll('.dashero, .dash__sectiontitle, .dashreq, .welcome > *');
    gsap.fromTo(els, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' });
  }, [requests]);

  if (!user) return null;

  const active = (requests || []).filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status));
  const history = (requests || []).filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));
  const completedCount = (requests || []).filter((r) => r.status === 'COMPLETED').length;
  const totalSpent = (requests || []).reduce((n, r) => n + (r.estimatedCost || 0), 0);
  const hour = new Date().getHours();
  const daypart = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="page dash">
      <div className="container" ref={rootRef}>
        {/* dark hero band */}
        <div className="dashero">
          <span className="dashero__orb dashero__orb--1" aria-hidden />
          <span className="dashero__orb dashero__orb--2" aria-hidden />
          <div className="dashero__top">
            <div className="dash__who">
              <span className="dash__avatar">{user.name[0]?.toUpperCase()}</span>
              <div>
                <span className="dashero__eyebrow">My dashboard</span>
                <h1>{daypart}, {user.name.split(' ')[0]} 👋</h1>
                <p className="dashero__meta">📞 {user.phone} &nbsp;·&nbsp; 📍 {user.address}</p>
              </div>
            </div>
            <div className="dash__actions">
              <Link to="/services" className="dashero__cta">+ Book a service</Link>
              <button className="dashero__logout" onClick={() => { logout(); nav('/'); }}>Log out</button>
            </div>
          </div>
          <div className="dashero__stats">
            <div><b>{requests?.length ?? '—'}</b><span>total bookings</span></div>
            <div><b>{active.length}</b><span>active now</span></div>
            <div><b>{completedCount}</b><span>completed</span></div>
            <div><b>₹{totalSpent}</b><span>total spent</span></div>
          </div>
        </div>

        {requests === null && <div className="empty">Loading your requests…</div>}

        {/* brand-new user: rich welcome instead of an empty page */}
        {requests !== null && requests.length === 0 && <WelcomeBoard name={user.name.split(' ')[0]} />}

        {/* active requests */}
        {requests !== null && requests.length > 0 && (
          <>
            <h3 className="dash__sectiontitle">Active requests {active.length > 0 && <em>· updates live</em>}</h3>
            {active.length === 0 && (
              <div className="dash__empty card">
                <p>No active requests. Need a hand at home?</p>
                <Link to="/services" className="btn btn-blue btn-sm">Browse services →</Link>
              </div>
            )}
            <div className="dash__list">
              {active.map((r) => <RequestCard key={r.id} r={r} onChanged={load} />)}
            </div>

            {/* history */}
            {history.length > 0 && (
              <>
                <h3 className="dash__sectiontitle" style={{ marginTop: 46 }}>History</h3>
                <div className="dash__list">
                  {history.map((r) => <RequestCard key={r.id} r={r} compact onChanged={load} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// First-visit welcome board — shown until the user makes their first request.
function WelcomeBoard({ name }) {
  const nav = useNavigate();
  const cats = [
    { emoji: '✨', t: 'Deep Cleaning', d: 'Homes, bathrooms & kitchens — hospital-grade sanitisation by trained staff.' },
    { emoji: '🍳', t: 'Cooking', d: 'Daily meals, tiffin prep and party chefs cooking fresh in your kitchen.' },
    { emoji: '🧺', t: 'Washing', d: 'Laundry, ironing and dishwashing — delicate care, spotless results.' },
  ];
  const steps = [
    { i: '📨', t: 'Request', d: 'Pick a service, choose a date, add a note' },
    { i: '🧑‍🔧', t: 'Get matched', d: 'A verified professional is assigned to you' },
    { i: '⏱️', t: 'Track & pay', d: 'Start/finish timestamped — pay for real work time' },
  ];

  return (
    <div className="welcome">
      {/* greeting banner */}
      <div className="welcome__hero card">
        <div className="welcome__hero-copy">
          <span className="welcome__wave">🎉</span>
          <h2>Welcome to Ms Help Hub, {name}!</h2>
          <p>
            Your account is ready. This is your dashboard — every service you request
            appears here with live status, your assigned professional and the bill.
            Need a hand at home? Make your first request now.
          </p>
          <div className="welcome__cta">
            <button className="btn btn-blue" onClick={() => nav('/services')}>Make your first request <span>→</span></button>
            <span className="welcome__offer">🎁 First booking · 1 hour at just <b>₹199</b></span>
          </div>
        </div>
      </div>

      {/* service cards */}
      <h3 className="dash__sectiontitle">What do you need help with?</h3>
      <div className="welcome__cats">
        {cats.map((c) => (
          <button key={c.t} className="card card--hover welcome__cat" onClick={() => nav('/services')}>
            <span className="welcome__cat-emoji">{c.emoji}</span>
            <h4>{c.t}</h4>
            <p>{c.d}</p>
            <span className="welcome__cat-go">Book now →</span>
          </button>
        ))}
      </div>

      {/* how it works strip */}
      <div className="welcome__steps card">
        {steps.map((st, i) => (
          <div className="welcome__step" key={st.t}>
            <span className="welcome__step-icon">{st.i}</span>
            <div>
              <b>{i + 1}. {st.t}</b>
              <p>{st.d}</p>
            </div>
            {i < steps.length - 1 && <span className="welcome__step-arrow">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Elapsed({ since }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.floor((Date.now() - new Date(since)) / 1000));
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return <b>{h > 0 ? `${h}h ` : ''}{m}m {s}s</b>;
}

function StarPicker({ onSubmit, busy }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  return (
    <div className="reviewbox">
      <p className="reviewbox__title">How was the service? Rate your professional:</p>
      <div className="reviewbox__stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={(hover || stars) >= n ? 'on' : ''}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStars(n)}
          >★</button>
        ))}
      </div>
      <input
        placeholder="Say a few words (optional) — shown on our homepage"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
      />
      <button className="btn btn-blue btn-sm" disabled={!stars || busy} onClick={() => onSubmit(stars, text)}>
        {busy ? 'Sending…' : 'Submit review →'}
      </button>
    </div>
  );
}

function RequestCard({ r, compact, onChanged }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const idx = STEPS.indexOf(r.status);
  const cancelled = r.status === 'CANCELLED';

  const act = async (fn) => {
    setBusy(true);
    setErr('');
    try { await fn(); onChanged?.(); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className={`card dashreq ${compact ? 'dashreq--compact' : ''}`}>
      <div className="dashreq__main">
        {r.service.imageUrl
          ? <img className="dashreq__img" src={r.service.imageUrl} alt="" />
          : <div className="dashreq__icon">{CAT_EMOJI[r.service.category] || '🛠️'}</div>}
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

          {/* customer start/stop controls */}
          {r.status === 'ASSIGNED' && (
            <div className="dashreq__act">
              <button className="btn btn-blue" disabled={busy} onClick={() => act(() => api.startRequest(r.id))}>
                ▶ Staff arrived — start work
              </button>
              <span className="muted">Tap when your professional reaches — the clock starts from here.</span>
            </div>
          )}
          {r.status === 'IN_PROGRESS' && (
            <div className="dashreq__act dashreq__act--running">
              <div className="dashreq__timer">
                <span className="dot on" /> Work in progress · <Elapsed since={r.startedAt} />
              </div>
              <button className="btn btn-dark" disabled={busy} onClick={() => act(() => api.completeRequest(r.id))}>
                ✓ Work done — stop & get bill
              </button>
            </div>
          )}
          {err && <div className="form__error" style={{ marginTop: 10 }}>{err}</div>}

          {/* review after completion */}
          {r.status === 'COMPLETED' && !r.rating && (
            <StarPicker busy={busy} onSubmit={(stars, text) => act(() => api.reviewRequest(r.id, stars, text))} />
          )}
          {r.rating && (
            <div className="dashreq__rated">
              <span className="quote__stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              {r.review && <em>“{r.review}”</em>}
              <span className="muted">Thanks for your review!</span>
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
