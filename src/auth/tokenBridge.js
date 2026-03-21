const jwt = require('jsonwebtoken');
const config = require('../config');
const log = require('../logger');

/**
 * Express middleware that validates an incoming JWT (issued by Uniware/Orchestrator)
 * and parses it into request context: { tenant_code, cloud, role }.
 *
 * The JWT is expected in the Authorization header as `Bearer <token>`.
 * This service never issues tokens — it only verifies and extracts context.
 */
function tokenBridge(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    log.warn({ path: req.path }, 'bridge_missing_token');
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const decoded = jwt.verify(token, config.CUBEJS_API_SECRET);

    req.contextInfo = {
      tenant_code: decoded.tenant_code,
      cloud: decoded.cloud,
      role: decoded.role,
    };

    next();
  } catch (err) {
    log.warn({ path: req.path, error: err.message }, 'bridge_invalid_token');
    return res.status(401).json({ error: `Invalid token: ${err.message}` });
  }
}

module.exports = tokenBridge;
