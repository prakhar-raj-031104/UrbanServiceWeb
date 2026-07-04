// WhatsApp notification service.
// Automatically sends a message to the business number whenever a new
// request comes in — the customer never has to send anything themselves.
//
// Providers:
//   - "baileys": links a WhatsApp account via one-time QR scan (free, no API)
//   - "twilio" : uses Twilio WhatsApp API (needs TWILIO_* env vars)
//   - "meta"   : uses Meta WhatsApp Cloud API (needs META_WA_* env vars)
//   - "log"    : no external call — logs the message + a click-to-chat wa.me link
//
// The design is provider-agnostic so you can flip WHATSAPP_PROVIDER in .env
// without touching any route code.

import { sendText } from './waClient.js';

const PROVIDER = process.env.WHATSAPP_PROVIDER || 'log';
const TO = (process.env.WHATSAPP_TO || '').replace(/[^\d]/g, '');

function buildRequestMessage(req, service) {
  // Tap-to-chat link to the CUSTOMER's number so the admin can reply instantly.
  const customerDigits = req.customerPhone.replace(/[^\d]/g, '');
  return [
    `🔔 *New Service Request* — ${req.code}`,
    ``,
    `*Service:* ${service.name} (${service.category})`,
    `*Customer:* ${req.customerName}`,
    `*Phone:* ${req.customerPhone}`,
    `*Address:* ${req.address}`,
    req.scheduledFor ? `*Scheduled:* ${new Date(req.scheduledFor).toLocaleString()}` : `*Scheduled:* ASAP`,
    req.notes ? `*Notes:* ${req.notes}` : null,
    ``,
    `💬 Chat with customer: https://wa.me/${customerDigits}`,
    `Open the admin panel to accept & assign staff.`,
  ]
    .filter(Boolean)
    .join('\n');
}

// wa.me click-to-chat link — always useful as a fallback / manual path.
export function waLink(text) {
  return `https://wa.me/${TO}?text=${encodeURIComponent(text)}`;
}

async function sendTwilio(text) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) throw new Error('Twilio env vars missing');

  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:+${TO}`,
    Body: text,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) throw new Error(`Twilio error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendMeta(text) {
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  if (!phoneId || !accessToken) throw new Error('Meta env vars missing');

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: TO,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) throw new Error(`Meta error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Main entry — never throws into the request flow; failures are logged only.
export async function notifyNewRequest(req, service) {
  const text = buildRequestMessage(req, service);
  const link = waLink(text);

  try {
    if (!TO) throw new Error('WHATSAPP_TO not configured');

    if (PROVIDER === 'baileys') {
      await sendText(TO, text);
      console.log(`[whatsapp] auto-sent to +${TO} for ${req.code}`);
    } else if (PROVIDER === 'twilio') {
      await sendTwilio(text);
      console.log(`[whatsapp] sent via Twilio to +${TO} for ${req.code}`);
    } else if (PROVIDER === 'meta') {
      await sendMeta(text);
      console.log(`[whatsapp] sent via Meta to ${TO} for ${req.code}`);
    } else {
      console.log(`\n[whatsapp:log] New request ${req.code} → +${TO}`);
      console.log(text);
      console.log(`[whatsapp:log] click-to-chat: ${link}\n`);
    }
    return { ok: true, provider: PROVIDER, link };
  } catch (err) {
    console.error(`[whatsapp] failed (${PROVIDER}):`, err.message);
    // Still return the manual link so the admin UI can offer a click-to-send.
    return { ok: false, provider: PROVIDER, error: err.message, link };
  }
}

export { buildRequestMessage };
