const MySQLDriver = require('@cubejs-backend/mysql-driver');
const { UNIWARE_CONFIG, WAREHOUSE_CONFIG } = require('../config');
const log = require('../logger');

/**
 * Step 3 of the 4-function chain.
 * Routes to the correct database based on dataSource and cloud from JWT.
 *
 * Two datasource types:
 *   - Per-cloud MySQL (default): uses UNIWARE_CONFIG[ctx.cloud]
 *   - Shared warehouse MySQL: uses WAREHOUSE_CONFIG
 *
 * Connection pool is a hard gate — overflow waits in Cube, not on DB.
 */
function driverFactory({ securityContext: ctx, dataSource }) {
  
  log.info({ cloud: ctx.cloud, dataSource }, 'driver_factory_called')
  if (dataSource === 'shared_warehouse') {
    log.info({ dataSource }, 'driver_warehouse');
    return new MySQLDriver(WAREHOUSE_CONFIG);
  }

  const hostConfig = UNIWARE_CONFIG[ctx.cloud];
  if (!hostConfig) {
    log.error({ cloud: ctx.cloud }, 'driver_unknown_cloud');
    throw new Error(`Unknown cloud: ${ctx.cloud}`);
  }

  log.info({ cloud: ctx.cloud, host: hostConfig.host }, 'driver_cloud');
  return new MySQLDriver({
    ...hostConfig,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
}

module.exports = driverFactory;
