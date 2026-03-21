/**
 * Uniware datasource configuration — maps cloud to MySQL host + pool settings.
 *
 * UNIWARE_CONFIG keys must exactly match:
 *   - cloud values in JWTs
 *   - entries returned by scheduledRefreshContexts
 * A mismatch causes cache misses and Cube falls through to MySQL on every request.
 */

const UNIWARE_CONFIG = {
  ecloud3: {
    host: 'db-slave.ecloud3-in.unicommerce.infra',
    database: 'uniware',
    pool: { min: 1, max: 5 },
  },
  replica_c3: {
    host: 'replica-c3.in.unicommerce.infra',
    database: 'Cloud30',
    pool: { min: 1, max: 5 },
  },
};

const WAREHOUSE_CONFIG = {
  host: process.env.WAREHOUSE_HOST || 'db.reco-stg-in.unicommerce.infra',
  port: parseInt(process.env.WAREHOUSE_PORT, 10) || 3306,
  database: process.env.WAREHOUSE_DB || 'uniware',
  user: process.env.WAREHOUSE_USER || 'root',
  password: process.env.WAREHOUSE_PASS || process.env.DB_PASS,
  pool: { min: 1, max: parseInt(process.env.WAREHOUSE_POOL_MAX, 10) || 4 },
};

module.exports = { UNIWARE_CONFIG, WAREHOUSE_CONFIG };
