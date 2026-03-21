const CubejsServer = require('@cubejs-backend/server');
const express = require('express');
const config = require('./src/config');
const tokenBridge = require('./src/auth/tokenBridge');

const app = express();
app.use(express.json());
app.use(tokenBridge);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const server = new CubejsServer();

server.listen({ port: config.PORT, app }).then(({ version, port }) => {
  console.log(`Cube.js ${version} listening on port ${port}`);
});
