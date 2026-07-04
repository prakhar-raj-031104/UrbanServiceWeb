// WhatsApp linking helper page.
// Open http://localhost:4000/wa in a browser to scan a crisp, auto-refreshing
// QR code. Once linked it shows a green "connected" state.

import { Router } from 'express';
import QRCode from 'qrcode';
import { waStatus } from '../services/waClient.js';

const router = Router();

// JSON status + QR as data-URL (polled by the page below)
router.get('/status', async (_req, res) => {
  const { ready, qr } = waStatus();
  let qrDataUrl = null;
  if (!ready && qr) {
    qrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
  }
  res.json({ ready, qrDataUrl });
});

// Human-friendly linking page
router.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Link WhatsApp — UrbanService</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,sans-serif;background:#0a0e1a;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}
  .card{background:#141a2e;border-radius:20px;padding:40px;text-align:center;max-width:420px}
  img{border-radius:12px;background:#fff;padding:8px}
  .ok{color:#17b26a;font-size:22px;font-weight:700}
  .muted{color:#8b93a7;font-size:14px;line-height:1.6;margin-top:14px}
  h2{margin:0 0 18px}
</style></head><body>
<div class="card">
  <h2>Link WhatsApp Sender</h2>
  <div id="box">Loading…</div>
  <p class="muted">On the sender phone: <b>WhatsApp → Settings → Linked devices → Link a device</b>, then scan.<br>This page refreshes automatically.</p>
</div>
<script>
async function tick(){
  try{
    const r = await fetch('/wa/status'); const d = await r.json();
    const box = document.getElementById('box');
    if(d.ready){ box.innerHTML = '<div class="ok">✅ Linked & connected</div><p class="muted">Messages now send automatically. You can close this page.</p>'; }
    else if(d.qrDataUrl){ box.innerHTML = '<img src="'+d.qrDataUrl+'" width="320" height="320">'; }
    else { box.innerHTML = '<p class="muted">Waiting for QR… (server may be reconnecting)</p>'; }
  }catch(e){ document.getElementById('box').textContent = 'API not reachable'; }
}
tick(); setInterval(tick, 2500);
</script>
</body></html>`);
});

export default router;
