import { useEffect, useRef, useState } from 'react';

const VIDEOS = ['/videos/bg1.mp4', '/videos/bg2.mp4', '/videos/bg3.mp4', '/videos/bg4.mp4', '/videos/bg5.mp4'];

// Full-bleed hero with a cross-fading background video carousel.
export default function VideoHero({ children }) {
  const [active, setActive] = useState(0);
  const videoRefs = useRef([]);

  // Advance to next clip when the current one ends (fallback: 9s timer).
  useEffect(() => {
    const el = videoRefs.current[active];
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
    const next = () => setActive((a) => (a + 1) % VIDEOS.length);
    const timer = setTimeout(next, 9000);
    el.addEventListener('ended', next);
    return () => {
      clearTimeout(timer);
      el.removeEventListener('ended', next);
    };
  }, [active]);

  return (
    <section className="hero">
      <div className="hero__bg">
        {VIDEOS.map((src, i) => (
          <video
            key={src}
            ref={(el) => (videoRefs.current[i] = el)}
            className={`hero__video ${i === active ? 'is-active' : ''}`}
            src={src}
            muted
            playsInline
            preload="auto"
          />
        ))}
        <div className="hero__overlay" />
      </div>
      <div className="hero__content">{children}</div>
      <div className="hero__dots">
        {VIDEOS.map((_, i) => (
          <button
            key={i}
            className={i === active ? 'on' : ''}
            aria-label={`Background ${i + 1}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </section>
  );
}
