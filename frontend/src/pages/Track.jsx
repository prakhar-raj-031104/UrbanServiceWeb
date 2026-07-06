import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { api } from '../lib/api.js';

const STEPS = [
  { key: 'PENDING', label: 'Requested', icon: '📨' },
  { key: 'ACCEPTED', label: 'Accepted', icon: '✅' },
  { key: 'ASSIGNED', label: 'Assigned', icon: '🧑‍🔧' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: '⚡' },
  { key: 'COMPLETED', label: 'Completed', icon: '🏁' },
];
const STEP_INDEX = { PENDING: 0, ACCEPTED: 1, ASSIGNED: 2, IN_PROGRESS: 3, COMPLETED: 4 };

const STATUS_COPY = {
  PENDING: { title: 'Waiting for confirmation', sub: 'Our team has been notified and is reviewing your request.' },
  ACCEPTED: { title: 'Request accepted', sub: 'We are matching the best professional for the job.' },
  ASSIGNED: { title: 'Professional assigned', sub: 'Your professional is on the way. You can call them anytime.' },
  IN_PROGRESS: { title: 'Work in progress', sub: 'The clock is running — billing is based on actual work time.' },
  COMPLETED: { title: 'All done!', sub: 'Thanks for choosing Ms Help Hub. Your bill is ready below.' },
  CANCELLED: { title: 'Request cancelled', sub: 'This request was cancelled. Book again anytime.' },
};

const CAT_META = {
  COOKING: { emoji: '🍳', grad: 'linear-gradient(135deg,#ff9a56,#ff5e62)' },
  WASHING: { emoji: '🧺', grad: 'linear-gradient(135deg,#43b6f6,#2f4bff)' },
  CLEANING: { emoji: '✨', grad: 'linear-gradient(135deg,#8b5cf6,#2f4bff)' },
  OTHER: { emoji: '🛠️', grad: 'linear-gradient(135deg,#334155,#0a0e1a)' },
};

const EVENT_ICON = { CREATED: '📨', ACCEPTED: '✅', ASSIGNED: '🧑‍🔧', STARTED: '▶️', COMPLETED: '🏁', CANCELLED: '✖️' };

export default function Track() {
  const [code, setCode] = useState('');
  const [req, setReq] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem('urban_recent_codes') || '[]'));
  const resultRef = useRef(null);

  const lookup = async (c) => {
    const clean = c.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const d = await api.trackRequest(clean);
      setReq(d.request);
      setCode(clean);
      const next = [clean, ...recent.filter((x) => x !== clean)].slice(0, 4);
      setRecent(next);
      localStorage.setItem('urban_recent_codes', JSON.stringify(next));
    } catch {
      setReq(null);
      setError(`No request found for “${clean}”. Double-check the code from your booking confirmation.`);
    } finally {
      setLoading(false);
    }
  };

  // live: re-poll the open request every 10s so status updates in real time
  useEffect(() => {
    if (!req) return;
    const id = setInterval(() => {
      api.trackRequest(req.code).then((d) => setReq(d.request)).catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [req?.code]);

  // entrance animation whenever a result loads
  useEffect(() => {
    if (!req || !resultRef.current) return;
    gsap.fromTo(
      resultRef.current.children,
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' }
    );
  }, [req?.code, req?.status]);

  const cancelled = req?.status === 'CANCELLED';
  const stepIdx = req ? (cancelled ? -1 : STEP_INDEX[req.status]) : -1;
  const cat = req ? CAT_META[req.service.category] || CAT_META.OTHER : null;
  const copy = req ? STATUS_COPY[req.status] : null;

  return (
    <main className="page trackpage">
      {/* ── hero / search ── */}
      <div className="page__hero trackpage__hero page__hero--dark">
        <div className="container">
          <span className="eyebrow">Track Request</span>
          <h1 className="page__title">Where's my <span className="accent">service?</span></h1>
          <p className="section-sub">Enter the request code you received when booking — updates appear live.</p>

          <form
            className="track__form card"
            onSubmit={(e) => { e.preventDefault(); lookup(code); }}
          >
            <span className="track__form-icon">#</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="UR-XXXX" maxLength={8} />
            <button className="btn btn-blue" disabled={loading || !code}>
              {loading ? 'Searching…' : 'Track →'}
            </button>
          </form>

          {recent.length > 0 && (
            <div className="track__recent">
              <span className="muted">Recent:</span>
              {recent.map((c) => (
                <button key={c} className="chip" onClick={() => lookup(c)}>{c}</button>
              ))}
            </div>
          )}

          {error && <div className="form__error track__error">{error}</div>}
        </div>
      </div>

      {/* ── result ── */}
      {req && (
        <div className="container trackpage__result" ref={resultRef}>
          {/* status banner */}
          <div className={`trackbanner card ${cancelled ? 'trackbanner--cancelled' : ''}`}>
            <div className="trackbanner__badge" style={{ background: cat.grad }}>{cat.emoji}</div>
            <div className="trackbanner__text">
              <div className="trackbanner__row">
                <h2>{req.service.name}</h2>
                <span className={`status status--${req.status}`}>{req.status.replace('_', ' ')}</span>
              </div>
              <p className="trackbanner__title">{copy.title}</p>
              <p className="muted">{copy.sub}</p>
            </div>
            <div className="trackbanner__code">
              <span className="muted">Request code</span>
              <b>{req.code}</b>
            </div>
          </div>

          {/* progress stepper */}
          {!cancelled && (
            <div className="stepper card">
              <div className="stepper__bar">
                <div className="stepper__fill" style={{ width: `${(stepIdx / (STEPS.length - 1)) * 100}%` }} />
              </div>
              <div className="stepper__steps">
                {STEPS.map((s, i) => (
                  <div key={s.key} className={`stepper__step ${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'now' : ''}`}>
                    <span className="stepper__dot">{i < stepIdx ? '✓' : s.icon}</span>
                    <span className="stepper__label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="track__grid">
            <div className="track__left">
              {/* booking details */}
              <div className="card detailcard">
                <h4 className="cardtitle">Booking details</h4>
                <div className="detailgrid">
                  <div><span className="detail__k">Customer</span><span className="detail__v">{req.customerName}</span></div>
                  <div><span className="detail__k">Phone</span><span className="detail__v">{req.customerPhone}</span></div>
                  <div className="detail--wide"><span className="detail__k">Address</span><span className="detail__v">{req.address}</span></div>
                  <div><span className="detail__k">Requested</span><span className="detail__v">{new Date(req.createdAt).toLocaleString()}</span></div>
                  <div><span className="detail__k">Scheduled</span><span className="detail__v">{req.scheduledFor ? new Date(req.scheduledFor).toLocaleString() : 'ASAP'}</span></div>
                  {req.notes && <div className="detail--wide"><span className="detail__k">Notes</span><span className="detail__v">“{req.notes}”</span></div>}
                </div>
              </div>

              {/* professional */}
              {req.staff && (
                <div className="card procard">
                  <h4 className="cardtitle">Your professional</h4>
                  <div className="procard__body">
                    <div className="procard__photo">
                      <img src={req.staff.photoUrl} alt={req.staff.name} />
                      <span className="procard__verified">✓</span>
                    </div>
                    <div className="procard__info">
                      <h3>{req.staff.name}</h3>
                      <div className="procard__stars">
                        {'★★★★★'.split('').map((s, i) => (
                          <span key={i} className={i < Math.round(req.staff.rating) ? 'on' : ''}>★</span>
                        ))}
                        <b>{req.staff.rating}</b>
                      </div>
                      <p className="muted">Verified & background-checked</p>
                    </div>
                    <a className="btn btn-blue procard__call" href={`tel:${req.staff.phone}`}>📞 Call</a>
                  </div>
                </div>
              )}

              {/* bill */}
              {req.status === 'COMPLETED' && (
                <div className="card billcard">
                  <div className="billcard__head">
                    <h4 className="cardtitle">Bill summary</h4>
                    <span className="billcard__paidtag">Estimate</span>
                  </div>
                  <div className="billcard__rows">
                    <div><span>Work started</span><b>{new Date(req.startedAt).toLocaleTimeString()}</b></div>
                    <div><span>Work finished</span><b>{new Date(req.completedAt).toLocaleTimeString()}</b></div>
                    <div><span>Duration</span><b>{req.durationMins} min</b></div>
                  </div>
                  <div className="billcard__total">
                    <span>Estimated cost</span>
                    <b>₹{req.estimatedCost}</b>
                  </div>
                </div>
              )}
            </div>

            {/* timeline */}
            <div className="card track__timeline">
              <h4 className="cardtitle">Live timeline</h4>
              <ul>
                {[...req.events].reverse().map((ev, i) => (
                  <li key={ev.id} className={i === 0 ? 'latest' : ''}>
                    <span className="tl__icon">{EVENT_ICON[ev.type] || '•'}</span>
                    <div>
                      <b>{ev.type.replace('_', ' ')}</b>
                      <p>{ev.message}</p>
                      <small>{new Date(ev.createdAt).toLocaleString()}</small>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="track__live"><span className="dot on" /> Updates automatically</div>
            </div>
          </div>
        </div>
      )}

      {/* empty state */}
      {!req && !error && (
        <div className="container trackpage__empty">
          <div className="emptytrack">
            <div className="emptytrack__icons"><span>🍳</span><span>🧺</span><span>✨</span></div>
            <h3>Your request status, live</h3>
            <p className="muted">Booking confirmation gives you a code like <b className="code">UR-8F3A</b>. Enter it above to see your professional, timestamps and bill — updated in real time.</p>
          </div>
        </div>
      )}
    </main>
  );
}
