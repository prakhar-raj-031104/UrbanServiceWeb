import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api } from '../lib/api.js';
import VideoHero from '../components/VideoHero.jsx';
import { useAuth } from '../lib/auth.jsx';

gsap.registerPlugin(ScrollTrigger);

/* Framer-style word reveal */
function Split({ text }) {
  return (
    <span className="split">
      {text.split(' ').map((w, i) => (
        <span className="w" key={i}><span>{w}&nbsp;</span></span>
      ))}
    </span>
  );
}

const CATEGORIES = [
  { key: 'CLEANING', title: 'Home Cleaning', emoji: '✨', tags: 'DEEP · BATHROOM · MOVE-IN', price: '₹239/hr', desc: 'Room-by-room deep care by trained specialists. Hospital-grade sanitisation, same professional every visit.', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80' },
  { key: 'COOKING', title: 'Home Cooking', emoji: '🍳', tags: 'MEAL PREP · DAILY · PARTY CHEF', price: 'from ₹249/hr', desc: 'A verified cook plans and cooks the meals your family actually wants — fresh, in your own kitchen.', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&q=80' },
  { key: 'WASHING', title: 'Fresh Laundry', emoji: '🧺', tags: 'WASH · IRON · FOLD', price: 'from ₹119/hr', desc: 'Picked up, pressed like a hotel, folded like home. Dishwashing and wardrobe care included.', img: 'https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=900&q=80' },
];

const STEPS = [
  { n: '01', t: 'Pick a service', d: 'Browse cooking, washing & cleaning with live staff availability and transparent pricing.' },
  { n: '02', t: 'Send a request', d: 'Share your address & preferred time. It reaches our team on WhatsApp and dashboard instantly.' },
  { n: '03', t: 'Get matched', d: 'A verified professional is assigned — you see their name, photo, rating and phone number.' },
  { n: '04', t: 'Track & pay fairly', d: 'Start & finish are timestamped. Your bill is computed from actual work time. No surprises.' },
];

const TESTIMONIALS = [
  { q: 'The cook arrived within the hour and the tracking page told me exactly who was coming. Feels like a five-star service.', n: 'Ritika S.', r: 'Homemaker, Shimoga', a: 'https://i.pravatar.cc/100?img=32' },
  { q: 'Transparent billing is the best part — I paid for exactly the time worked, and saw the timestamps myself.', n: 'Aman K.', r: 'Product Manager', a: 'https://i.pravatar.cc/100?img=13' },
  { q: 'Booked a deep clean before Diwali. The professional was verified, punctual and the house looked brand new.', n: 'Neha & Raj', r: 'Vinobha Nagar, Shimoga', a: 'https://i.pravatar.cc/100?img=44' },
];

const MARQUEE = ['Home Cooking', 'Deep Cleaning', 'Laundry & Washing', 'Party Chefs', 'Bathroom Cleaning', 'Dishwashing', 'Meal Prep', 'Same-day Service'];

export default function Landing() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ serviceId: '', address: '', scheduledFor: '', notes: '' });
  const [formState, setFormState] = useState({ sending: false, done: null, error: '' });
  const [agree, setAgree] = useState(false);
  const root = useRef(null);
  const trackRef = useRef(null);

  // prefill address once the user is known
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, address: f.address || user.address }));
  }, [user]);

  const [live, setLive] = useState({ reviews: [], average: null, count: 0 });

  useEffect(() => {
    api.listServices().then((d) => setServices(d.services)).catch(() => {});
    api.getReviews().then(setLive).catch(() => {});
  }, []);

  // real customer reviews replace the placeholders once they exist
  const quotes = live.reviews.length
    ? live.reviews.slice(0, 3).map((rv, i) => ({
        q: rv.review || `Rated ${rv.rating}★ for ${rv.service.name} — great service!`,
        n: rv.customerName,
        r: `${rv.service.name} · Shimoga`,
        a: `https://i.pravatar.cc/100?img=${(i * 17 + 11) % 70}`,
        stars: rv.rating,
      }))
    : TESTIMONIALS.map((t) => ({ ...t, stars: 5 }));

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero word-reveal + entrance sequence
      gsap.timeline({ defaults: { ease: 'power4.out' } })
        .to('.hero .split .w > span', { y: 0, duration: 1.1, stagger: 0.06, delay: 0.15 })
        .from('[data-hero-fade]', { y: 26, opacity: 0, duration: 0.9, stagger: 0.1 }, '-=0.7');

      // Scroll reveals
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, { y: 48, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      gsap.utils.toArray('[data-stagger]').forEach((group) => {
        gsap.from(group.children, { y: 44, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: group, start: 'top 86%' } });
      });
      // Section headings word-reveal on scroll
      gsap.utils.toArray('.split--scroll').forEach((el) => {
        gsap.to(el.querySelectorAll('.w > span'), { y: 0, duration: 1, ease: 'power4.out', stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 88%' } });
      });

      // Showcase: pinned horizontal scroll — cards glide right→left, scrubbed
      // to the user's vertical scroll (with a smooth 1.2s catch-up).
      const track = trackRef.current;
      if (track && track.children.length > 1) {
        const amount = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
        gsap.to(track, {
          x: () => -amount(),
          ease: 'none',
          scrollTrigger: {
            trigger: '#showcase',
            start: 'top top',
            end: () => `+=${amount()}`,
            scrub: 1.2,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      // Stacking cards: as the next card arrives, the previous scales back & dims.
      // Scrubbed 1:1 to scroll position — timing always matches the user's pace.
      const stackCards = gsap.utils.toArray('.stack__card');
      stackCards.forEach((card, i) => {
        if (i === stackCards.length - 1) return;
        gsap.to(card, {
          scale: 0.93, opacity: 0.45, filter: 'blur(2px)', transformOrigin: 'center top', ease: 'none',
          scrollTrigger: { trigger: stackCards[i + 1], start: 'top bottom-=120', end: 'top top+=260', scrub: 0.4 },
        });
      });

      // Parallax on category images
      gsap.utils.toArray('.catcard__img img').forEach((img) => {
        gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: img.closest('.catcard'), start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [services.length]);

  const submitQuick = async (e) => {
    e.preventDefault();
    setFormState({ sending: true, done: null, error: '' });
    try {
      const res = await api.createRequest({
        serviceId: form.serviceId,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
      });
      setFormState({ sending: false, done: res.request.code, error: '' });
    } catch (err) {
      setFormState({ sending: false, done: null, error: err.message });
    }
  };

  return (
    <main ref={root}>
      {/* ─── HERO ─── */}
      <VideoHero>
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="hero__tag" data-hero-fade>Trusted home services · Shimoga</span>
            <h1><Split text="First booking · 1 hour" /><br /><span className="accent-soft"><Split text="at just ₹149." /></span></h1>
            <p className="hero__sub" data-hero-fade>
              Verified professionals for cooking, washing & deep cleaning.
              Then just ₹239/hr — and jobs over 3 hours cost a flat ₹599.
            </p>
            <div className="hero__cta" data-hero-fade>
              <button className="btn btn-white" onClick={() => nav('/services')}>Book a service <span>→</span></button>
              <button className="btn btn-outline" onClick={() => nav('/track')}>Track a request</button>
            </div>
            <div className="hero__stats" data-hero-fade>
              <div><b>12k+</b><span>jobs done</span></div><i />
              <div><b>4.9</b><span>avg rating</span></div><i />
              <div><b>800+</b><span>verified pros</span></div><i />
              <div><b>30 min</b><span>avg dispatch</span></div>
            </div>
          </div>

          <div className="hero__panel" data-hero-fade>
            <div className="quickpick">
              <p className="quickpick__title">What do you need help with?</p>
              <div className="quickpick__grid">
                {CATEGORIES.map((c) => (
                  <button key={c.key} className="quickpick__tile" onClick={() => nav('/services')}>
                    <span className="quickpick__emoji">{c.emoji}</span>
                    <span className="quickpick__name">{c.title}</span>
                    <span className="quickpick__from">Book now →</span>
                  </button>
                ))}
              </div>
              <div className="quickpick__foot"><span className="dot on" /> 8 professionals online now</div>
            </div>
          </div>
        </div>
      </VideoHero>

      {/* ─── MARQUEE ─── */}
      <div className="marquee" aria-hidden>
        <div className="marquee__track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i}>{m} <em>✦</em></span>
          ))}
        </div>
      </div>

      {/* ─── CATEGORIES (Urban Company style) ─── */}
      <section className="section">
        <div className="container">
          <div className="sechead">
            <div>
              <span className="eyebrow">What we do</span>
              <h2 className="section-title split--scroll"><Split text="Everyday services," /><br /><Split text="done properly." /></h2>
            </div>
            <p className="section-sub">Three things, done exceptionally well — with trained, background-checked professionals and honest time-based billing.</p>
          </div>
          <div className="catgrid" data-stagger>
            {CATEGORIES.map((c, i) => (
              <article className="catcard" key={c.key} onClick={() => nav('/services')}>
                <div className="catcard__img shine">
                  <span className="catcard__num">0{i + 1}</span>
                  <img src={c.img} alt={c.title} loading="lazy" />
                </div>
                <div className="catcard__row">
                  <h3>{c.title}</h3>
                  <span className="catcard__price">{c.price}</span>
                </div>
                <p className="catcard__tags">{c.tags}</p>
                <p className="catcard__desc">{c.desc}</p>
                <span className="catcard__explore">Explore <i>↗</i></span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SHOWCASE (horizontal slider) ─── */}
      <section id="showcase" className="showcase">
        <div className="container showcase__head">
          <div>
            <span className="eyebrow">All services</span>
            <h2 className="section-title split--scroll"><Split text="Pick yours." /></h2>
          </div>
          <span className="showcase__hint">Keep scrolling ⟶</span>
        </div>
        <div className="showcase__viewport">
          <div className="showcase__track" ref={trackRef}>
            {services.map((s) => (
              <article className="bigcard shine" key={s.id} onClick={() => nav('/services')}>
                <div className="bigcard__img" style={{ backgroundImage: `url(${s.imageUrl})` }}>
                  <span className={`bigcard__avail ${s.available ? 'ok' : 'no'}`}>
                    <span className={`dot ${s.available ? 'on' : 'off'}`} />{s.availableStaffCount} available
                  </span>
                </div>
                <div className="bigcard__body">
                  <span className="bigcard__cat">{s.category}</span>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <div className="bigcard__foot">
                    <span><b>₹{s.hourlyRate}/hr</b> · 3 hrs+ flat ₹599</span>
                    <span className="bigcard__go">Book →</span>
                  </div>
                </div>
              </article>
            ))}
            <div className="bigcard bigcard--cta" onClick={() => nav('/services')}>
              <div className="bigcard--cta__inner">
                <h3>See all<br />services</h3>
                <button className="btn btn-white">Browse <span>→</span></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (editorial list) ─── */}
      <section className="section howto howto--dark">
        <div className="container">
          <div className="sechead">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 className="section-title split--scroll"><Split text="Request to done," /><br /><Split text="in four steps." /></h2>
            </div>
            <p className="section-sub">You always know who's coming, when they started, and exactly what it costs.</p>
          </div>
          <div className="stack">
            {STEPS.map((s, i) => (
              <div className="stack__card" key={s.n} style={{ top: `calc(15vh + ${i * 26}px)` }}>
                <span className="stack__watermark">{s.n}</span>
                <div className="stack__content">
                  <span className="stack__n">Step {s.n}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF (bento wall) ─── */}
      <section className="section quotes">
        <div className="container">
          <div className="sechead">
            <div>
              <span className="eyebrow">Loved locally</span>
              <h2 className="section-title split--scroll"><Split text="People trust us" /><br /><Split text="with their homes." /></h2>
            </div>
            <p className="section-sub">Real bookings, real timestamps, real reviews from homes across Shimoga.</p>
          </div>

          <div className="bento" data-stagger>
            {/* featured quote */}
            <figure className="bento__tile bento__quote bento__quote--big card card--hover">
              <div className="quote__stars">{'★'.repeat(quotes[0].stars)}</div>
              <blockquote>“{quotes[0].q}”</blockquote>
              <figcaption>
                <img src={quotes[0].a} alt={quotes[0].n} />
                <div><b>{quotes[0].n}</b><span>{quotes[0].r}</span></div>
              </figcaption>
              <span className="bento__mark">”</span>
            </figure>

            {/* rating summary */}
            <div className="bento__tile bento__rating card card--hover">
              <b className="bento__big">{live.average ?? 4.9}</b>
              <div className="quote__stars">★★★★★</div>
              <p>average rating across<br /><b>{live.count > 0 ? `${live.count} verified review${live.count === 1 ? '' : 's'}` : '200+ Shimoga homes'}</b></p>
              <div className="avatars">
                {[32, 13, 44, 47, 12].map((n) => <img key={n} src={`https://i.pravatar.cc/60?img=${n}`} alt="" />)}
              </div>
            </div>

            {/* photo tile */}
            <div className="bento__tile bento__photo card card--hover">
              <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700&q=80" alt="Deep cleaning" />
              <div className="bento__photo-cap">
                <span className="dot on" /> Deep clean · Vinobha Nagar · today
              </div>
            </div>

            {/* quote 2 */}
            <figure className="bento__tile bento__quote card card--hover">
              <div className="quote__stars">{'★'.repeat((quotes[1] || quotes[0]).stars)}</div>
              <blockquote>“{(quotes[1] || quotes[0]).q}”</blockquote>
              <figcaption>
                <img src={(quotes[1] || quotes[0]).a} alt="" />
                <div><b>{(quotes[1] || quotes[0]).n}</b><span>{(quotes[1] || quotes[0]).r}</span></div>
              </figcaption>
            </figure>

            {/* stat tile (dark) */}
            <div className="bento__tile bento__stat card">
              <b className="bento__big">98%</b>
              <p>of customers book<br />a second service</p>
              <span className="bento__stat-glow" />
            </div>

            {/* chat-style tile */}
            <div className="bento__tile bento__chat card card--hover">
              <div className="bento__bubble bento__bubble--in">Need a kitchen deep clean tomorrow 10am 🙏</div>
              <div className="bento__bubble bento__bubble--out">Booked ✓ Deepa (4.9★) is assigned — she'll arrive at 10:00 <span>✓✓</span></div>
              <p className="bento__chat-cap">Avg. confirmation — under 30 min</p>
            </div>

            {/* quote 3 */}
            <figure className="bento__tile bento__quote card card--hover">
              <div className="quote__stars">{'★'.repeat((quotes[2] || quotes[0]).stars)}</div>
              <blockquote>“{(quotes[2] || quotes[0]).q}”</blockquote>
              <figcaption>
                <img src={(quotes[2] || quotes[0]).a} alt="" />
                <div><b>{(quotes[2] || quotes[0]).n}</b><span>{(quotes[2] || quotes[0]).r}</span></div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ─── GUARANTEES ─── */}
      <section className="assure">
        <div className="container">
          <div className="assure__grid" data-stagger>
            <div className="assure__item">
              <span className="assure__icon">🛡️</span>
              <h4>Verified & insured</h4>
              <p>Every professional is ID-verified and background-checked before their first job.</p>
            </div>
            <div className="assure__item">
              <span className="assure__icon">⏱️</span>
              <h4>On-time promise</h4>
              <p>Timestamped arrivals — if we're late beyond 30 minutes, your minimum charge is waived.</p>
            </div>
            <div className="assure__item">
              <span className="assure__icon">💰</span>
              <h4>Honest billing</h4>
              <p>₹249/hr billed on actual work time with a ₹500 minimum. No hidden charges, ever.</p>
            </div>
            <div className="assure__item">
              <span className="assure__icon">🔁</span>
              <h4>Re-do guarantee</h4>
              <p>Not happy with the finish? We'll send someone back within 24 hours, free.</p>
            </div>
          </div>
        </div>
        <div className="bigword" aria-hidden>
          <div className="bigword__track">
            <span>MS&nbsp;HELP&nbsp;HUB&nbsp;✦&nbsp;SHIMOGA&nbsp;✦&nbsp;MS&nbsp;HELP&nbsp;HUB&nbsp;✦&nbsp;SHIMOGA&nbsp;✦&nbsp;</span>
            <span>MS&nbsp;HELP&nbsp;HUB&nbsp;✦&nbsp;SHIMOGA&nbsp;✦&nbsp;MS&nbsp;HELP&nbsp;HUB&nbsp;✦&nbsp;SHIMOGA&nbsp;✦&nbsp;</span>
          </div>
        </div>
      </section>

      {/* ─── BOOKING FORM (end of page, NovaWave style) ─── */}
      <section className="section bookend" id="book">
        <div className="container bookend__grid" data-reveal>
          <div className="bookend__copy">
            <span className="eyebrow eyebrow--light">Get started</span>
            <h2>Let's get it<br />done today.</h2>
            <p>Tell us what you need — our team is notified on WhatsApp the moment you hit send, and a verified professional gets assigned to you.</p>
            <div className="bookend__meta">
              <span>📞 +91 98889 91549</span>
              <span>📍 Shimoga, Karnataka · 7 days · 8am–9pm</span>
            </div>
          </div>
          <form className="bookend__form" onSubmit={submitQuick}>
            {!user ? (
              <div className="bookend__done">
                <span>🔐</span>
                <h3>Log in to book</h3>
                <p>One free account — then every booking is two taps, tracked live in your dashboard.</p>
                <button type="button" className="btn btn-white" onClick={() => nav('/auth')}>Log in / Sign up <span>→</span></button>
              </div>
            ) : formState.done ? (
              <div className="bookend__done">
                <span>✓</span>
                <h3>Request sent!</h3>
                <p>Request <b>{formState.done}</b> is live in your dashboard.</p>
                <button type="button" className="btn btn-white" onClick={() => nav('/dashboard')}>Open dashboard <span>→</span></button>
              </div>
            ) : (
              <>
                <div className="bookend__userline">Booking as <b>{user.name}</b> · {user.phone}</div>
                <select required value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
                  <option value="">Choose a service…</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name} — ₹{s.hourlyRate}/hr</option>)}
                </select>
                <input required placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
                <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <label className="tickrow tickrow--dark">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
                  <span>I agree to the terms and conditions</span>
                </label>
                {formState.error && <div className="bookend__error">{formState.error}</div>}
                <button className="btn btn-white bookend__submit" disabled={formState.sending || !agree}>
                  {formState.sending ? 'Sending…' : <>Send request <span>→</span></>}
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
