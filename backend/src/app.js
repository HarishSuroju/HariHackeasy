const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { apiLimiter } = require('./middleware/rateLimiters');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const stateRoutes = require('./routes/state');
const organizerRoutes = require('./routes/organizer');
const announcementRoutes = require('./routes/announcement');
const scheduleRoutes = require('./routes/schedule');
const zoneRoutes = require('./routes/zones');

function createApp() {
  const app = express();

  // Security headers (sets sensible defaults: no sniffing, no framing, etc.)
  app.use(helmet());

  // Restrict CORS to configured origins in production; default to permissive
  // for local development so the Vite dev server keeps working out of the box.
  const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : true;
  app.use(cors({ origin: allowedOrigins }));

  app.use(express.json({ limit: '100kb' }));
  app.use('/api', apiLimiter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api', stateRoutes);
  app.use('/api', organizerRoutes);
  app.use('/api', announcementRoutes);
  app.use('/api', scheduleRoutes);
  app.use('/api', zoneRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
