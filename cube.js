/**
 * Cube.js configuration — wires together modular components.
 *
 * Architecture (4-function chain per request):
 *   1. checkAuth              — JWT verify → securityContext { tenant_code, cloud, role }
 *   2. contextToOrchestratorId — cloud → isolated cache slab + refresh queue
 *   3. driverFactory           — cloud → MySQL host | 'shared_warehouse' → warehouse MySQL
 *   4. queryRewrite            — inject WHERE tenant_code = ctx.tenant_code (server-side)
 */

const log = require('./src/logger');
const checkAuth = require('./src/auth/checkAuth');
const {
  contextToOrchestratorId,
  driverFactory,
  queryRewrite,
} = require('./src/context');
const scheduledRefreshContexts = require('./src/refresh/scheduledContexts');

module.exports = {
  checkAuth,
  contextToOrchestratorId,
  driverFactory,
  queryRewrite,
  scheduledRefreshContexts,

  contextToAppId: ({ securityContext }) => {
    return securityContext?.cloud || 'default';
  },

  schemaVersion: ({ securityContext }) => {
    const cloud = securityContext?.cloud || 'default';
    log.debug({ cloud }, 'schema_version');
    return cloud;
  },

  preAggregationsSchema: ({ securityContext }) => {
    const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const cloud = securityContext?.cloud || 'default';
    const schema = `${env}_pre_aggregations_${cloud}`;
    log.debug({ cloud, schema }, 'pre_agg_schema');
    return schema;
  },

  logger: (msg, params) => {
    const isError = /error/i.test(msg);
    const level = isError ? 'error' : 'info';
    const { securityContext, ...rest } = params;

    log[level]({ cloud: securityContext?.cloud, msg, ...rest }, msg);
  },

  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 2,
    },
  },

  telemetry: false,
};
