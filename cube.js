/**
 * Cube.js configuration — wires together modular components.
 *
 * Architecture (4-function chain per request):
 *   1. checkAuth          — JWT verify → securityContext { tenant_id, cloud_id, role }
 *   2. contextToOrchestratorId — cloud_id → isolated cache slab + refresh queue
 *   3. driverFactory       — cloud_id → MySQL host | 'shared_warehouse' → Postgres
 *   4. queryRewrite        — inject WHERE tenant_id = ctx.tenant_id (server-side)
 */

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

  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 2,
    },
  },

  telemetry: false,
};
