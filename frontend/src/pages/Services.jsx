import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { api } from '../lib/api.js';
import RequestModal from '../components/RequestModal.jsx';

const CATS = [
  { key: '', label: 'All' },
  { key: 'COOKING', label: 'Cooking' },
  { key: 'WASHING', label: 'Washing' },
  { key: 'CLEANING', label: 'Cleaning' },
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const params = {};
      if (q) params.q = q;
      if (cat) params.category = cat;
      if (onlyAvailable) params.available = 'true';
      api.listServices(params)
        .then((d) => { setServices(d.services); setActive(0); })
        .catch(() => setServices([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat, onlyAvailable]);

  // Watch which card is in the middle of the viewport → drives the sticky panel
  useEffect(() => {
    if (!listRef.current || services.length === 0) return;
    const cards = Array.from(listRef.current.querySelectorAll('.svcshow__card'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(Number(en.target.dataset.idx));
        });
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [services]);

  // Crossfade the panel whenever the active service changes
  useEffect(() => {
    if (!panelRef.current) return;
    gsap.fromTo(panelRef.current, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' });
  }, [active, services]);

  const totalStaff = useMemo(() => services.reduce((n, s) => n + s.availableStaffCount, 0), [services]);
  const current = services[active];

  return (
    <main className="page">
      <div className="page__hero page__hero--dark">
        <div className="container">
          <span className="eyebrow">Our Services</span>
          <div className="promobanner">🎉 First booking — 1 hour at just <b>₹149</b></div>
          <h1 className="page__title">Find the right help<br />for your home</h1>
          <p className="section-sub">₹239/hr with a verified professional · jobs over 3 hours cost a flat ₹599 (one person).</p>

          <div className="searchbar card">
            <div className="searchbar__input">
              <span>🔍</span>
              <input placeholder="Search e.g. cooking, laundry, deep clean…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="searchbar__cats">
              {CATS.map((c) => (
                <button key={c.key} className={`chip ${cat === c.key ? 'chip--on' : ''}`} onClick={() => setCat(c.key)}>{c.label}</button>
              ))}
            </div>
            <label className="switch">
              <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
              <span>Available now</span>
            </label>
          </div>
          <div className="searchbar__meta">
            {loading ? 'Searching…' : `${services.length} services · ${totalStaff} professionals available now`}
          </div>
        </div>
      </div>

      {/* ── scroll showcase: cards left, sticky detail right ── */}
      {services.length > 0 && (
        <div className="container svcshow">
          <div className="svcshow__list" ref={listRef}>
            {services.map((s, i) => (
              <article
                key={s.id}
                data-idx={i}
                className={`svcshow__card ${i === active ? 'is-active' : ''}`}
                onClick={() => setBooking(s)}
              >
                <img src={s.imageUrl} alt={s.name} loading="lazy" />
                <div className="svcshow__card-overlay">
                  <span className="svcshow__card-cat">{s.category}</span>
                  <h3>{s.name}</h3>
                </div>
                {/* mobile-only inline info */}
                <div className="svcshow__card-mobile">
                  <p>{s.description}</p>
                  <div className="svcshow__card-mrow">
                    <b>₹{s.hourlyRate}/hr <small>· 3 hrs+ ₹599</small></b>
                    <button className="btn btn-blue btn-sm" onClick={(e) => { e.stopPropagation(); setBooking(s); }}>Request →</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="svcshow__sticky">
            {current && (
              <div className="svcshow__panel card" ref={panelRef} key={current.id}>
                <div className="svcshow__panel-top">
                  <span className="bigcard__cat">{current.category}</span>
                  <span className={`avail ${current.available ? 'ok' : 'no'}`}>
                    <span className={`dot ${current.available ? 'on' : 'off'}`} />
                    {current.available ? 'Available now' : 'Fully booked'}
                  </span>
                </div>
                <h2>{current.name}</h2>
                <p className="svcshow__desc">{current.description}</p>

                <div className="svcshow__facts">
                  <div><span>Per hour</span><b>₹{current.hourlyRate}</b></div>
                  <div><span>3 hrs+ flat</span><b>₹599</b></div>
                  <div><span>Professionals</span><b>{current.availableStaffCount}/{current.staffCount}</b></div>
                </div>

                <div className="svcshow__staff">
                  <div className="avatars">
                    {current.staff.slice(0, 4).map((st) => (
                      <img key={st.id} src={st.photoUrl} alt={st.name} title={`${st.name} · ${st.rating}★`} />
                    ))}
                  </div>
                  <span className="muted">Verified & background-checked</span>
                </div>

                <button className="btn btn-blue svcshow__book" onClick={() => setBooking(current)}>
                  Request this service <span>→</span>
                </button>
                <p className="svcshow__count">{String(active + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}</p>
              </div>
            )}
          </aside>
        </div>
      )}

      {!loading && services.length === 0 && (
        <div className="container"><div className="empty">No services match your search. Try a different term.</div></div>
      )}

      {booking && <RequestModal service={booking} onClose={() => setBooking(null)} />}
    </main>
  );
}
