import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../lib/auth.jsx';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', phone: '', address: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
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
        .to('.authart__title .w > span', { y: 0, duration: 1, stagger: 0.08, delay: 0.1 })
        .from('.authart__shape', { scale: 0, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'back.out(1.6)' }, '-=0.7')
        .from('.authart__card', { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, clearProps: 'all' }, '-=0.6');
    }, root);
    return () => ctx.revert();
  }, []);

  // animate fields when switching login/signup
  useEffect(() => {
    if (!fieldsRef.current) return;
    gsap.fromTo(fieldsRef.current.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' });
    setError('');
    setAgree(false);
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
      gsap.fromTo('.authform', { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="authsplit" ref={root}>
      {/* ── left: brand art frame (filled) ── */}
      <section className="authart" aria-hidden>
        {/* backdrop shapes */}
        <span className="authart__shape authart__shape--halfblue" />
        <span className="authart__shape authart__shape--circle" />
        <span className="authart__shape authart__shape--tri" />
        <span className="authart__shape authart__shape--halfnavy" />
        <span className="authart__shape authart__shape--blob" />
        <span className="authart__shape authart__shape--ring" />
        <span className="authart__dots" />
        <span className="authart__dots authart__dots--2" />

        <div className="authart__inner">
          <span className="authart__eyebrow">Ms Help Hub · Shimoga</span>
          <h2 className="authart__title">
            <span className="split"><span className="w"><span>Here&nbsp;to&nbsp;help,</span></span></span><br />
            <span className="split authart__accent"><span className="w"><span>every&nbsp;step.</span></span></span>
          </h2>
          <p className="authart__sub">
            Book verified professionals for cooking, washing & deep cleaning —
            tracked live, billed honestly.
          </p>

          {/* floating info cards */}
          <div className="authart__cards">
            <div className="authart__card authart__card--review">
              <div className="authart__stars">★★★★★</div>
              <p>“Punctual, professional and the house looked brand new.”</p>
              <div className="authart__reviewer">
                <img src="https://i.pravatar.cc/60?img=44" alt="" />
                <span><b>Neha & Raj</b> · Vinobha Nagar</span>
              </div>
            </div>

            <div className="authart__card authart__card--live">
              <span className="dot on" />
              <div>
                <b>UR-8F3A · Deep Home Cleaning</b>
                <span>In progress · Deepa (4.9★) on the job</span>
              </div>
            </div>

            <div className="authart__card authart__card--stat">
              <b>12k+</b>
              <span>jobs completed<br />across Shimoga</span>
            </div>

            <div className="authart__card authart__card--offer">
              🎉 <div><b>First booking · 1 hour</b><span>at just ₹149</span></div>
            </div>
          </div>

          {/* service tags */}
          <div className="authart__tags">
            <span>🍳 Cooking</span>
            <span>🧺 Washing</span>
            <span>✨ Deep Cleaning</span>
            <span>🧽 Bathrooms</span>
            <span>🛋 Sofa & Carpet</span>
          </div>
        </div>
      </section>

      {/* ── right: form ── */}
      <section className="authsplit__form">
        <form className="authform" onSubmit={submit}>
          <img className="authform__logo" src="/logo.png" alt="Ms Help Hub"
               onError={(e) => (e.currentTarget.style.display = 'none')} />
          <h1 className="authform__title">{mode === 'login' ? 'Login' : 'Sign up'}</h1>

          <div className="authform__fields" ref={fieldsRef}>
            {mode === 'signup' && (
              <input className="authfield" required value={form.name} onChange={set('name')} placeholder="Full name" />
            )}
            <input className="authfield" required value={form.phone} onChange={set('phone')} placeholder="Mobile number" inputMode="numeric" />
            {mode === 'signup' && (
              <input className="authfield" required value={form.address} onChange={set('address')} placeholder="Address — area, Shimoga" />
            )}
            <div className="authfield authfield--pw">
              <input
                required
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Password"
                minLength={6}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Show password">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="authform__row">
            <span className="muted">{mode === 'signup' ? 'Free forever · takes 30 seconds' : 'Stay logged in for 30 days'}</span>
          </div>

          {mode === 'signup' && (
            <label className="tickrow tickrow--center">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
              <span>I agree to the terms and conditions</span>
            </label>
          )}

          {error && <div className="form__error">{error}</div>}

          <button className="authform__submit" disabled={busy || (mode === 'signup' && !agree)}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>

          <p className="authform__switch">
            {mode === 'login' ? (
              <>Don't have an account? <button type="button" onClick={() => setMode('signup')}>Sign up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => setMode('login')}>Login</button></>
            )}
          </p>
          <p className="authform__secure">🛡️ Encrypted & never shared</p>
        </form>
      </section>
    </main>
  );
}
