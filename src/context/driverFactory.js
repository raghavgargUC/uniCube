const MySQLDriver = require('@cubejs-backend/mysql-driver');
const { UNIWARE_CONFIG, WAREHOUSE_CONFIG } = require('../config');
const log = require('../logger');

/**
 * Per-cloud driver cache. Multiple tenants on the same cloud reuse one
 * connection pool instead of each getting their own (which would happen
 * if Cube's internal per-orchestrator caching were the only layer,
 * since orchestrator ID is now per-tenant).
 */
const driverCache = new Map();

function driverFactory({ securityContext: ctx, dataSource }) {
  if (dataSource === 'shared_warehouse') {
    if (!driverCache.has('__warehouse__')) {
      log.debug({ dataSource }, 'driver_warehouse_init');
      driverCache.set('__warehouse__', new MySQLDriver(WAREHOUSE_CONFIG));
    }
    return driverCache.get('__warehouse__');
  }

  const cloud = ctx.cloud;
  if (driverCache.has(cloud)) {
    return driverCache.get(cloud);
  }

  const hostConfig = UNIWARE_CONFIG[cloud];
  if (!hostConfig) {
    log.error({ cloud }, 'driver_unknown_cloud');
    throw new Error(`Unknown cloud: ${cloud}`);
  }

  log.debug({ cloud, host: hostConfig.host }, 'driver_cloud_init');
  const driver = new MySQLDriver({
    ...hostConfig,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
  driverCache.set(cloud, driver);
  return driver;
}

module.exports = driverFactory;
