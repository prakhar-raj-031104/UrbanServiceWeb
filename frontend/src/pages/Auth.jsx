import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../lib/auth.jsx';

const PERKS = [
  { icon: '⚡', t: 'Two-tap booking', d: 'Your details are saved — never re-type them' },
  { icon: '📍', t: 'Live tracking', d: 'Watch every request move, stage by stage' },
  { icon: '🧾', t: 'Honest bills', d: 'Timestamped work, transparent pricing' },
];

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', phone: '', address: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const root = useRef(null);
  const fieldsRef = useRef(null);

  // entrance choreography
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .from('.authpage__side > *', { y: 34, opacity: 0, duration: 0.9, stagger: 0.09 })
        .from('.authpage__card', { y: 40, opacity: 0, scale: 0.97, duration: 0.9 }, '-=0.6')
        .from('.authfloat', { scale: 0, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'back.out(1.7)' }, '-=0.5');
    }, root);
    return () => ctx.revert();
  }, []);

  // animate fields when switching login/signup
  useEffect(() => {
    if (!fieldsRef.current) return;
    gsap.fromTo(fieldsRef.current.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' });
    setError('');
  }, [mode]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(form.phone, form.password);
      else await signup(form);
      nav(next);
    } catch (err) {
      setError(err.message);
      gsap.fromTo('.authpage__card', { x: -7 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page authpage" ref={root}>
      {/* animated background orbs */}
      <span className="authorb authorb--1" aria-hidden />
      <span className="authorb authorb--2" aria-hidden />
      <span className="authorb authorb--3" aria-hidden />

      <div className="container authpage__grid">
        <div className="authpage__side">
          <span className="eyebrow">Ms Help Hub · Shimoga</span>
          <h1>
            {mode === 'login' ? <>Welcome<br />back.</> : <>Your home,<br />handled.</>}
          </h1>
          <p>
            One account for everything — book cooking, washing & cleaning in two taps,
            see exactly who's coming, and track every request live. No codes to remember.
          </p>

          <div className="authpage__perklist">
            {PERKS.map((p) => (
              <div className="authperk" key={p.t}>
                <span className="authperk__icon">{p.icon}</span>
                <div>
                  <b>{p.t}</b>
                  <span>{p.d}</span>
                </div>
              </div>
            ))}
          </div>

          {/* floating service tiles */}
          <div className="authpage__floats" aria-hidden>
            <span className="authfloat" style={{ '--d': '0s' }}>🍳</span>
            <span className="authfloat" style={{ '--d': '.8s' }}>🧺</span>
            <span className="authfloat" style={{ '--d': '1.6s' }}>✨</span>
          </div>
        </div>

        <form className="card authpage__card" onSubmit={submit}>
          <div className="authpage__cardhead">
            <img src="/logo.png" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <h3>{mode === 'login' ? 'Log in to your account' : 'Create your account'}</h3>
            <p className="muted">{mode === 'login' ? 'Book & track in seconds' : 'Free forever · 30 seconds'}</p>
          </div>

          <div className={`authpage__tabs authpage__tabs--${mode}`}>
            <span className="authpage__tabglider" aria-hidden />
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
            <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Sign up</button>
          </div>

          <div className="authpage__fields" ref={fieldsRef}>
            {mode === 'signup' && (
              <label>
                Full name
                <div className="authinput">
                  <span>👤</span>
                  <input required value={form.name} onChange={set('name')} placeholder="Your name" />
                </div>
              </label>
            )}
            <label>
              Mobile number
              <div className="authinput">
                <span>📱</span>
                <input required value={form.phone} onChange={set('phone')} placeholder="10-digit number" inputMode="numeric" />
              </div>
            </label>
            {mode === 'signup' && (
              <label>
                Address
                <div className="authinput">
                  <span>📍</span>
                  <input required value={form.address} onChange={set('address')} placeholder="Flat, street, area — Shimoga" />
                </div>
              </label>
            )}
            <label>
              Password
              <div className="authinput">
                <span>🔒</span>
                <input required type="password" value={form.password} onChange={set('password')} placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'} minLength={6} />
              </div>
            </label>
          </div>

          {error && <div className="form__error">{error}</div>}

          <button className="btn authpage__submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? <>Log in <span>→</span></> : <>Create account <span>→</span></>}
          </button>

          <p className="authpage__switch">
            {mode === 'login' ? (
              <>New here? <button type="button" className="link" onClick={() => setMode('signup')}>Create an account</button></>
            ) : (
              <>Already registered? <button type="button" className="link" onClick={() => setMode('login')}>Log in</button></>
            )}
          </p>
          <p className="authpage__secure">🛡️ Your details are encrypted & never shared</p>
        </form>
      </div>
    </main>
  );
}
