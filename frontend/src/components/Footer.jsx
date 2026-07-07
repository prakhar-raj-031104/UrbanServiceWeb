import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="nav__logo" style={{ color: '#fff' }}>
            <img src="/logo.png" alt="Ms Help Hub" className="nav__logoimg nav__logoimg--footer"
                 onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span>Ms Help&nbsp;<b>Hub</b></span>
          </div>
          <p className="footer__tagline">Here to Help, Every Step.</p>
          <p>Trusted cooking, washing & home-cleaning professionals, on demand. Book in minutes, track in real time.</p>
        </div>
        <div className="footer__col">
          <h4>Services</h4>
          <Link to="/services">Home Cooking</Link>
          <Link to="/services">Laundry & Washing</Link>
          <Link to="/services">Deep Cleaning</Link>
        </div>
        <div className="footer__col">
          <h4>Company</h4>
          <Link to="/">About</Link>
          <Link to="/track">Track Request</Link>
          <Link to="/admin">Admin Panel</Link>
          <Link to="/terms">Terms & Conditions</Link>
        </div>
        <div className="footer__col">
          <h4>Contact</h4>
          <span>hello@mshelphub.in</span>
          <span>+91 80954 66795</span>
          <span>+91 96066 07818</span>
          <span>Kushinagar Prabhas Apartment, opposite Shimoga 577201</span>
          <span>Open 7 days · 9am–7pm</span>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} Ms Help Hub. All rights reserved.</span>
        <span>Built with React · Node · PostgreSQL</span>
      </div>
    </footer>
  );
}
