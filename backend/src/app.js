const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const publicDir = path.join(__dirname, '..', 'public');
const clientDir = process.env.CLIENT_DIST_DIR
  ? path.resolve(process.env.CLIENT_DIST_DIR)
  : path.join(__dirname, '..', '..', 'frontend', 'dist');
const clientIndex = path.join(clientDir, 'index.html');
const hasClient = fs.existsSync(clientIndex);

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 0);

app.use(helmet());
app.use(express.json({ limit: '100kb' }));
if (hasClient) app.use(express.static(clientDir));
app.use(express.static(publicDir));

app.use('/api', apiRoutes);

if (hasClient) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || !req.accepts('html')) return next();
    return res.sendFile(clientIndex);
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
