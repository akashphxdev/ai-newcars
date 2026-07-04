import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import routes from '@/routes/index';
import { errorHandler, notFoundHandler } from '@/core/middleware/errorHandler';
import { UPLOAD_ROOT } from '@/core/utils/fileStorage.util';

export function createApp() {
  const app = express();

  // IMPORTANT: must be set before any middleware that reads req.ip /
  // X-Forwarded-For (rate limiter, getClientIp, etc.). Without this,
  // behind a reverse proxy (nginx/ALB/Cloudflare/Render/etc.) every
  // request looks like it comes from the proxy's IP — breaking
  // per-IP rate limiting on /login and /verify-otp, and corrupting
  // the IP address stored in audit logs.
  // "1" = trust the first hop (the proxy directly in front of this app).
  // If you have more than one proxy hop in front of you, increase this
  // number or use a specific IP/CIDR instead — see:
  // https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || env.corsOrigin.includes('*') || env.corsOrigin.includes(origin)) {
            return callback(null, true);
          }
          callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
      })
    );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Basic rate limiting — tune per-route later for auth/leads endpoints
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(
    '/uploads',
    express.static(UPLOAD_ROOT, {
      setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'TimesAuto API server is running ',
      docs: '/api/v1/health',
    });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}