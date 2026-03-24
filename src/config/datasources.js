/**
 * Uniware datasource configuration — parses cloud hosts from UNIWARE_HOSTS env var.
 *
 * UNIWARE_HOSTS format (JSON):
 *   { "cloud_key": { "host": "...", "database": "...", "pool": { "min": 1, "max": 5 } }, ... }
 *
 * Keys are lowercased at parse time so lookups from JWTs and
 * scheduledRefreshContexts are always case-insensitive.
 */

const log = require('../logger');

let UNIWARE_CONFIG = {};
try {
  const raw = JSON.parse(process.env.UNIWARE_HOSTS || '{}');
  for (const [key, value] of Object.entries(raw)) {
    UNIWARE_CONFIG[key.toLowerCase()] = value;
  }
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
