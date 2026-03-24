const CubejsServer = require('@cubejs-backend/server');
const express = require('express');
const config = require('./src/config');
const log = require('./src/logger');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  log.error({ err: err.message, stack: err.stack }, 'unhandled_error');
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await config.MongoRegistry.init();

  const server = new CubejsServer();
  const { version, port } = await server.listen({ port: config.PORT, app });
  log.info({ version, port }, 'server_started');

  const shutdown = async () => {
    log.info('shutting_down');
    await config.MongoRegistry.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  log.error({ err: err.message, stack: err.stack }, 'startup_failed');
  process.exit(1);
});
