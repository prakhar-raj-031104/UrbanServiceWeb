// Baileys-based WhatsApp client.
// Links to a WhatsApp account via a one-time QR scan (like WhatsApp Web),
// then sends messages automatically — no paid API needed.
//
// First run: the server prints a QR code in the terminal/log.
// Scan it from the phone that will act as the SENDER
// (WhatsApp > Linked devices > Link a device).
// The session is persisted in backend/.wa-auth so you only scan once.

import * as baileys from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { fileURLToPath } from 'url';

const makeWASocket = baileys.makeWASocket ?? baileys.default;
const { useMultiFileAuthState, DisconnectReason } = baileys;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.resolve(__dirname, '../../.wa-auth');

let sock = null;
let ready = false;
let lastQr = null;

export function waStatus() {
  return { ready, hasQr: !!lastQr, qr: lastQr };
}

export async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      lastQr = qr;
      console.log('\n[whatsapp] Scan this QR with the sender phone (WhatsApp → Linked devices):\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      ready = true;
      lastQr = null;
      console.log('[whatsapp] ✅ Linked & connected — messages will send automatically.');
    }

    if (connection === 'close') {
      ready = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.error('[whatsapp] Logged out. Delete backend/.wa-auth and restart to re-link.');
      } else {
        console.log('[whatsapp] Connection closed — reconnecting…');
        setTimeout(() => initWhatsApp().catch((e) => console.error('[whatsapp] reconnect failed:', e.message)), 2000);
      }
    }
  });
}

// Send a plain text message to an international number like "919888991549".
export async function sendText(number, text) {
  if (!sock || !ready) {
    throw new Error('WhatsApp not linked yet — scan the QR shown in the server log');
  }
  const jid = `${number.replace(/[^\d]/g, '')}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
}
