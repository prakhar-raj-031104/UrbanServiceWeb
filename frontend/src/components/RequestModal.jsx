import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function RequestModal({ service, onClose }) {
  const [form, setForm] = useState({ customerName: '', customerPhone: '', address: '', notes: '', scheduledFor: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // { code, whatsapp }

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
      const payload = {
        serviceId: service.id,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || undefined,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
      };
      const res = await api.createRequest(payload);
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

        {!done ? (
          <>
            <span className="pill">{service.category}</span>
            <h2 className="modal__title">Request · {service.name}</h2>
            <p className="muted modal__price">
              ₹{service.hourlyRate}/hr · minimum bill ₹{service.basePrice} · billed on actual work time
            </p>

            <form className="form" onSubmit={submit}>
              <div className="form__row">
                <label>
                  Full name
                  <input required value={form.customerName} onChange={set('customerName')} placeholder="Your name" />
                </label>
                <label>
                  Phone (WhatsApp)
                  <input required value={form.customerPhone} onChange={set('customerPhone')} placeholder="+91 …" />
                </label>
              </div>
              <label>
                Address
                <input required value={form.address} onChange={set('address')} placeholder="Flat, street, area, city" />
              </label>
              <div className="form__row">
                <label>
                  Preferred time (optional)
                  <input type="datetime-local" value={form.scheduledFor} onChange={set('scheduledFor')} />
                </label>
                <label>
                  Notes (optional)
                  <input value={form.notes} onChange={set('notes')} placeholder="Anything we should know?" />
                </label>
              </div>

              {error && <div className="form__error">{error}</div>}

              <button className="btn btn-blue" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Request →'}
              </button>
              <p className="form__note">
                Your request goes straight to our team on WhatsApp + admin dashboard for the fastest match.
              </p>
            </form>
          </>
        ) : (
          <div className="success">
            <div className="success__check">✓</div>
            <h2>Request sent!</h2>
            <p>
              Your request code is <b className="code">{done.request.code}</b>. Our team has been notified
              automatically on WhatsApp and will assign a professional shortly.
            </p>
            <div className="success__actions">
              <Link to={`/track`} className="btn btn-dark">Track request →</Link>
            </div>
            <button className="link" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
