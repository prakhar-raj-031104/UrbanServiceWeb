import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

export default function RequestModal({ service, onClose }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [form, setForm] = useState({ address: user?.address || '', notes: '', scheduledFor: '' });
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.createRequest({
        serviceId: service.id,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
      });
      setDone(res);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card card" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>✕</button>

        {!user ? (
          /* ── not logged in ── */
          <div className="success">
            <div className="modal__lockicon">🔐</div>
            <h2>Log in to book</h2>
            <p>
              Create a free account once — after that every booking is two taps, and you can
              track everything live from your dashboard.
            </p>
            <div className="success__actions">
              <button className="btn btn-blue" onClick={() => nav(`/auth?next=${encodeURIComponent(pathname)}`)}>
                Log in / Sign up →
              </button>
            </div>
          </div>
        ) : !done ? (
          /* ── booking form (profile-prefilled) ── */
          <>
            <span className="pill">{service.category}</span>
            <h2 className="modal__title">Request · {service.name}</h2>
            <p className="muted modal__price">
              ₹{service.hourlyRate}/hr · 3 hrs+ flat ₹599 · first booking: 1st hour ₹199
            </p>

            <div className="modal__userline">
              Booking as <b>{user.name}</b> · {user.phone}
            </div>

            <form className="form" onSubmit={submit}>
              <label>
                Address
                <input required value={form.address} onChange={set('address')} placeholder="Where should we come?" />
              </label>
              <div className="form__row">
                <label>
                  When? (optional — ASAP if empty)
                  <input type="datetime-local" value={form.scheduledFor} onChange={set('scheduledFor')} />
                </label>
                <label>
                  Notes (optional)
                  <input value={form.notes} onChange={set('notes')} placeholder="Anything we should know?" />
                </label>
              </div>

              <label className="tickrow">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
                <span>I agree to the <Link to="/terms" target="_blank" className="tickrow__link">terms and conditions</Link></span>
              </label>

              {error && <div className="form__error">{error}</div>}

              <button className="btn btn-blue" disabled={submitting || !agree}>
                {submitting ? 'Sending…' : 'Send Request →'}
              </button>
              <p className="form__note">
                Our team is notified instantly on WhatsApp — track everything from your dashboard.
              </p>
            </form>
          </>
        ) : (
          /* ── success ── */
          <div className="success">
            <div className="success__check">✓</div>
            <h2>Request sent!</h2>
            <p>
              Request <b className="code">{done.request.code}</b> is now in your dashboard —
              live status, assigned professional and bill, all in one place.
            </p>
            <div className="success__actions">
              <Link to="/dashboard" className="btn btn-dark">Open my dashboard →</Link>
            </div>
            <button className="link" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
