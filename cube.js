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

log.info('Cube.js configuration loaded');

module.exports = {
  checkAuth,
  contextToOrchestratorId,
  driverFactory,
  queryRewrite,
  scheduledRefreshContexts,

  preAggregationsSchema: ({ securityContext }) =>
    `pre_agg_${(securityContext.cloud || 'default').replace(/[^a-zA-Z0-9_]/g, '_')}`,

  logger: (msg, params) => {
    const isError = /error/i.test(msg);
    const level = isError ? 'error' : 'info';
    const { securityContext, ...rest } = params;

    log[level]({ cloud: securityContext?.cloud, msg, ...rest }, msg);
  },

  // TODO need to remove it
  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 2,
    },
  },

  telemetry: false,
};
