import { useState } from 'react';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

const WA = '918095466795';

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact__grid > *', { y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.15 });
    }, root);
    return () => ctx.revert();
  }, []);

  const send = (e) => {
    e.preventDefault();
    const text = `Hi Ms Help Hub! 👋\nI'm ${form.name} (${form.phone}).\n${form.message}`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <main className="page" ref={root}>
      <div className="page__hero page__hero--dark">
        <div className="container">
          <span className="eyebrow">Contact us</span>
          <h1 className="page__title">Let's talk.</h1>
          <p className="section-sub">Questions, custom requests or feedback — we reply within 30 minutes, 9am–7pm.</p>
        </div>
      </div>

      <div className="container section contact__grid" style={{ paddingTop: 50 }}>
        {/* info tiles */}
        <div className="contact__tiles">
          <a className="contact__tile contact__tile--blue" href="tel:+918095466795">
            <span className="contact__icon">📞</span>
            <b>Call us</b>
            <p>+91 80954 66795<br />+91 96066 07818</p>
            <span className="contact__go">Tap to call →</span>
          </a>
          <a className="contact__tile contact__tile--dark" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">
            <span className="contact__icon">💬</span>
            <b>WhatsApp</b>
            <p>Fastest response —<br />usually under 30 min</p>
            <span className="contact__go">Chat now →</span>
          </a>
          <div className="contact__tile contact__tile--mint">
            <span className="contact__icon">📍</span>
            <b>Visit us</b>
            <p>Kushinagar Prabhas Apartment,<br />opposite Shimoga 577201</p>
          </div>
          <div className="contact__tile contact__tile--violet">
            <span className="contact__icon">🕘</span>
            <b>Working hours</b>
            <p>Open 7 days<br />9am – 7pm</p>
          </div>
        </div>

        {/* message form */}
        <form className="card contact__form" onSubmit={send}>
          <h3>Send us a message</h3>
          <p className="muted">It opens straight in WhatsApp — no waiting on emails.</p>
          <input className="authfield" required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="authfield" required placeholder="Mobile number" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <textarea className="authfield contact__msg" required rows={5} placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button className="btn btn-blue" style={{ justifyContent: 'center' }}>Send on WhatsApp <span>→</span></button>
          <p className="authform__secure">🛡️ We never share your details</p>
        </form>
      </div>
    </main>
  );
}
