import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { calculateRouter } from './routes/calculate.routes';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json({ limit: '1kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', calculateRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
  app.use(errorHandler);

  return app;
}
