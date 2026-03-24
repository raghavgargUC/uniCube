const { MongoRegistry } = require('../config');
const log = require('../logger');

/**
 * Generates one scheduledRefreshContext per subscribed tenant.
 * Each context carries a subscriptions map so that repositoryFactory
 * can load only the model files the tenant is subscribed to —
 * no pre-agg tables are created for unsubscribed models.
 *
 * Tenants on the same cloud share a MySQL driver (via driverFactory cache)
 * but get their own CubeStore schema and orchestrator context.
 */
async function scheduledRefreshContexts() {
  const tenants = MongoRegistry.getSubscribedTenants();

  const contexts = tenants.map((t) => ({
    securityContext: {
      tenant_code: t.tenant_code,
      cloud: t.cloud,
      subscriptions: t.subscriptions,
    },
  }));

  log.debug(
    { count: contexts.length, tenants: contexts.map((c) => c.securityContext.tenant_code) },
    'refresh_contexts',
  );
  return contexts;
}

module.exports = scheduledRefreshContexts;
