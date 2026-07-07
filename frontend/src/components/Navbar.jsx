import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      setHidden(y > 140 && y > lastY); // hide going down, show going up
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dark = pathname === '/' && !scrolled;

  return (
    <header className={`nav ${scrolled ? 'nav--solid' : ''} ${dark ? 'nav--onhero' : ''} ${hidden ? 'nav--hidden' : ''}`}>
      <div className="container nav__inner">
        <Link to="/" className="nav__logo">
          <img src="/logo.png" alt="Ms Help Hub" className="nav__logoimg"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span>Ms Help&nbsp;<b>Hub</b></span>
        </Link>
        <nav className="nav__links">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/services" className={pathname === '/services' ? 'active' : ''}>Services</Link>
          {user
            ? <Link to="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>My Requests</Link>
            : <Link to="/track" className={pathname === '/track' ? 'active' : ''}>Track</Link>}
          <Link to="/contact" className={pathname === '/contact' ? 'active' : ''}>Contact</Link>
          <Link to="/admin" className={pathname === '/admin' ? 'active' : ''}>Admin</Link>
        </nav>
        <div className="nav__right">
          {user ? (
            <Link to="/dashboard" className="nav__user" title="My dashboard">
              <span className="nav__useravatar">{user.name[0]?.toUpperCase()}</span>
              <span className="nav__username">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <button className="nav__login" onClick={() => nav('/auth')}>Log in</button>
          )}
          <button className="nav__cta" onClick={() => nav('/services')}>
            Book a Service <span>→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
