/**
 * Uniware datasource configuration — parses cloud hosts from UNIWARE_HOSTS env var.
 *
 * UNIWARE_HOSTS format (JSON):
 *   { "cloud_key": { "host": "...", "database": "...", "pool": { "min": 1, "max": 5 } }, ... }
 *
 * Keys must exactly match:
 *   - cloud values in JWTs
 *   - entries returned by scheduledRefreshContexts
 * A mismatch causes cache misses and Cube falls through to MySQL on every request.
 */

const log = require('../logger');

let UNIWARE_CONFIG = {};
try {
  UNIWARE_CONFIG = JSON.parse(process.env.UNIWARE_HOSTS || '{}');
} catch (err) {
  log.error({ error: err.message }, 'Failed to parse UNIWARE_HOSTS env var');
  process.exit(1);
}

const WAREHOUSE_CONFIG = {
  host: process.env.WAREHOUSE_HOST || 'db.reco-stg-in.unicommerce.infra',
  port: parseInt(process.env.WAREHOUSE_PORT, 10) || 3306,
  database: process.env.WAREHOUSE_DB || 'uniware',
  user: process.env.WAREHOUSE_USER || 'root',
  password: process.env.WAREHOUSE_PASS || process.env.DB_PASS,
  pool: { min: 1, max: parseInt(process.env.WAREHOUSE_POOL_MAX, 10) || 4 },
};

module.exports = { UNIWARE_CONFIG, WAREHOUSE_CONFIG };
