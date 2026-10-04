import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: (process.env.TRUSTED_ORIGINS || '').split(',').filter(Boolean),
    credentials: true,
  })
);

// Better Auth handles its own body parsing on this route.
app.use('/api/auth', toNodeHandler(auth));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'mad-api', time: new Date().toISOString() });
});

app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return res.status(401).json({ user: null });
  res.json({ user: session.user });
});

app.listen(PORT, () => {
  console.log(`mad-api listening on :${PORT}`);
});
