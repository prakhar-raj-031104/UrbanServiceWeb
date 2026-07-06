import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', phone: '', address: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';

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
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page authpage">
      <div className="container authpage__grid">
        <div className="authpage__side">
          <span className="eyebrow">Ms Help Hub</span>
          <h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
          <p>
            One account for everything — book services in two taps, see who's assigned,
            and track every request live from your dashboard. No codes to remember.
          </p>
          <ul className="authpage__perks">
            <li>⚡ Book without re-typing your details</li>
            <li>📍 Live status of every request</li>
            <li>🧾 Full history & transparent bills</li>
          </ul>
        </div>

        <form className="card authpage__card" onSubmit={submit}>
          <div className="authpage__tabs">
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button>
            <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Sign up</button>
          </div>

          {mode === 'signup' && (
            <label>
              Full name
              <input required value={form.name} onChange={set('name')} placeholder="Your name" />
            </label>
          )}
          <label>
            Mobile number
            <input required value={form.phone} onChange={set('phone')} placeholder="10-digit number" inputMode="numeric" />
          </label>
          {mode === 'signup' && (
            <label>
              Address
              <input required value={form.address} onChange={set('address')} placeholder="Flat, street, area — Shimoga" />
            </label>
          )}
          <label>
            Password
            <input required type="password" value={form.password} onChange={set('password')} placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'} minLength={6} />
          </label>

          {error && <div className="form__error">{error}</div>}

          <button className="btn btn-blue authpage__submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in →' : 'Create account →'}
          </button>

          <p className="authpage__switch">
            {mode === 'login' ? (
              <>New here? <button type="button" className="link" onClick={() => setMode('signup')}>Create an account</button></>
            ) : (
              <>Already registered? <button type="button" className="link" onClick={() => setMode('login')}>Log in</button></>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
