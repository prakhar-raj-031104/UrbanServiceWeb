import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import servicesRouter from './routes/services.js';
import requestsRouter from './routes/requests.js';
import adminRouter from './routes/admin.js';
import { initWhatsApp, waStatus } from './services/waClient.js';
import waRouter from './routes/wa.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP off: /wa page uses a tiny inline script
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
app.use(express.json({ limit: '3mb' })); // staff photos arrive as base64 data-URLs
app.use(morgan('dev'));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'urbanservice-api', whatsapp: waStatus().ready ? 'linked' : 'not-linked' })
);

app.use('/wa', waRouter);
app.use('/api/services', servicesRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/admin', adminRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

// central error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ UrbanService API listening on http://localhost:${PORT}`));

// Link the WhatsApp sender session (QR scan on first run).
if (process.env.WHATSAPP_PROVIDER === 'baileys') {
  initWhatsApp().catch((e) => console.error('[whatsapp] init failed:', e.message));
}
