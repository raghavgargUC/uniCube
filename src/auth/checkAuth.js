const jwt = require('jsonwebtoken');
const config = require('../config');
const log = require('../logger');

/**
 * Step 1 of the 4-function chain (Cube internal).
 * Verifies JWT signature and extracts claims into securityContext.
 *
 * Expected JWT payload: { tenant_code, cloud, role }
 * Token is issued by Uniware/Orchestrator — this service never mints tokens.
 */
function checkAuth(req, auth) {
  const token = (auth || '').replace(/^Bearer\s+/i, '');

  if (!token) {
    log.warn('auth_missing_token');
    throw new Error('No authorization token provided');
  }

  try {
    const decoded = jwt.verify(token, config.CUBEJS_API_SECRET);
    req.securityContext = decoded;
    log.debug({ cloud: decoded.cloud, tenant_code: decoded.tenant_code }, 'auth_success');
  } catch (err) {
    log.warn({ error: err.message }, 'auth_failed');
    throw new Error(`Invalid token: ${err.message}`);
  }
}

module.exports = checkAuth;
