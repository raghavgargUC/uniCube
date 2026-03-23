const { UNIWARE_CONFIG } = require('../config');

/**
 * Generates one scheduledRefreshContext per cloud host.
 * Each context spawns its own refresh thread — fully isolated per cloud.
 * A slow Cloud 1 refresh never blocks Cloud 2–N.
 *
 * Adding a new model with its own refresh_key requires zero changes here.
 * This function automatically covers all configured clouds.
 */
const log = require('../logger');

async function scheduledRefreshContexts() {
  log.info("inside scheduled refresh contexts");
  const clouds = Object.keys(UNIWARE_CONFIG);
  log.info({ clouds }, 'scheduled_refresh_contexts');
  return clouds.map((cloud) => ({
    securityContext: { cloud, tenant_code: null },
  }));
}

module.exports = scheduledRefreshContexts;
