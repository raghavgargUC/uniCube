const CubejsServer = require('@cubejs-backend/server');
const express = require('express');
const config = require('./src/config');
const log = require('./src/logger');
const tokenBridge = require('./src/auth/tokenBridge');

const app = express();
app.use(express.json());
app.use(tokenBridge);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  log.error({ err: err.message, stack: err.stack }, 'unhandled_error');
  res.status(500).json({ error: 'Internal server error' });
});

const server = new CubejsServer();

server.listen({ port: config.PORT, app }).then(({ version, port }) => {
  log.info({ version, port }, 'server_started');
});
