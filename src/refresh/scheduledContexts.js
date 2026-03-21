const { UNIWARE_CONFIG } = require('../config');

/**
 * Generates one scheduledRefreshContext per cloud host.
 * Each context spawns its own refresh thread — fully isolated per cloud.
 * A slow Cloud 1 refresh never blocks Cloud 2–N.
 *
 * Adding a new model with its own refresh_key requires zero changes here.
 * This function automatically covers all configured clouds.
 */
async function scheduledRefreshContexts() {
  return Object.keys(UNIWARE_CONFIG).map((cloud) => ({
    securityContext: { cloud, tenant_code: null },
  }));
}

module.exports = scheduledRefreshContexts;
