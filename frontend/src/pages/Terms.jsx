import { Link } from 'react-router-dom';

const TERMS = [
  { t: 'Booking & account', d: 'Services can only be requested through a registered account with accurate name, mobile number and address. Bookings are confirmed once accepted by our team.' },
  { t: 'Pricing', d: 'Prices are strictly as per the decided amounts shown at booking — ₹239/hr for cleaning services (minimum 1 hour billed), a flat ₹599 for jobs over 3 hours (one person), and the first-booking offer of ₹199 for the first hour. The final bill is computed from the recorded start and finish timestamps.' },
  { t: 'No refund policy', d: 'All payments made for completed services are final and non-refundable. If you are unhappy with the finish, our re-do guarantee applies instead (see point 7).' },
  { t: 'Damage to items', d: 'Ms Help Hub is not responsible for any damage, breakage or loss of items caused during the service, including damage caused by the service provider. Customers are advised to secure valuables and fragile items before work begins.' },
  { t: 'Work timing', d: 'Work start and completion are marked in the dashboard by the customer or admin. The recorded duration is binding for billing. Our working hours are 9am–7pm, 7 days a week.' },
  { t: 'Cancellations', d: 'Requests can be cancelled free of charge any time before a professional is assigned. Cancellation after the professional has arrived may attract the minimum charge.' },
  { t: 'Re-do guarantee', d: 'If you are not satisfied with the quality of the finish, we will send a professional back within 24 hours for a free re-do of the reported areas. This is the sole remedy for quality issues.' },
  { t: 'Customer responsibilities', d: 'Customers must provide safe access to the premises, water and electricity as required for the service, and a safe working environment for our professionals.' },
  { t: 'Conduct & safety', d: 'Any misbehaviour, harassment or unsafe demands towards service providers will lead to immediate termination of the service (full charges apply) and account suspension.' },
  { t: 'Changes to terms', d: 'Ms Help Hub may update these terms from time to time. Continued use of the website and services after changes means you accept the updated terms.' },
];

export default function Terms() {
  return (
    <main className="page">
      <div className="page__hero page__hero--dark">
        <div className="container">
          <span className="eyebrow">Legal</span>
          <h1 className="page__title">Terms & Conditions</h1>
          <p className="section-sub">Please read these carefully — by creating an account or booking a service you agree to the terms below.</p>
        </div>
      </div>
      <div className="container section" style={{ paddingTop: 44, maxWidth: 900 }}>
        <ol className="terms">
          {TERMS.map((x, i) => (
            <li className="card terms__item" key={x.t}>
              <span className="terms__num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ marginTop: 26, fontSize: 13.5 }}>
          Questions? Reach us at +91 80954 66795 / +91 96066 07818 · Kushinagar Prabhas Apartment, opposite Shimoga 577201.
          &nbsp;<Link to="/services" className="accent">Back to services →</Link>
        </p>
      </div>
    </main>
  );
}
