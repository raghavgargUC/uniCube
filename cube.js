/**
 * Cube.js configuration — wires together modular components.
 *
 * Architecture (4-function chain per request):
 *   1. checkAuth              — JWT verify → securityContext { tenant_code, cloud, role }
 *   2. contextToOrchestratorId — tenant_code → isolated cache slab + refresh queue
 *   3. driverFactory           — cloud → cached MySQL driver (shared across tenants on same cloud)
 *   4. queryRewrite            — inject WHERE tenant_code = ctx.tenant_code (defense-in-depth)
 *
 * Pre-aggregations are per-tenant: each tenant gets its own CubeStore schema
 * and compiled Cube schema, driven by MongoDB subscriptions.
 *
 * repositoryFactory filters model files so the refresh worker only compiles
 * models a tenant has subscribed to — unsubscribed models get zero CubeStore
 * tables. API queries load all models so any cube can be queried.
 */

const fs = require('fs');
const path = require('path');
const log = require('./src/logger');
const checkAuth = require('./src/auth/checkAuth');
const {
  contextToOrchestratorId,
  driverFactory,
  queryRewrite,
} = require('./src/context');
const scheduledRefreshContexts = require('./src/refresh/scheduledContexts');

const MODEL_DIR = path.join(__dirname, 'model');

let _modelFilesCache = null;
function getAllModelFiles() {
  if (!_modelFilesCache) {
    _modelFilesCache = fs
      .readdirSync(MODEL_DIR)
      .filter((f) => f.endsWith('.js'))
      .map((f) => ({
        fileName: path.join('model', f),
        content: fs.readFileSync(path.join(MODEL_DIR, f), 'utf-8'),
        modelName: f.replace('.js', ''),
      }));
  }
  return _modelFilesCache;
}

module.exports = {
  checkAuth,
  contextToOrchestratorId,
  driverFactory,
  queryRewrite,
  scheduledRefreshContexts,

  repositoryFactory: ({ securityContext }) => {
    const allFiles = getAllModelFiles();
    const subs = securityContext?.subscriptions;

    const files = subs
      ? allFiles.filter((f) => f.modelName in subs)
      : allFiles;

    return {
      dataSchemaFiles: () =>
        Promise.resolve(
          files.map(({ fileName, content }) => ({ fileName, content })),
        ),
    };
  },

  contextToAppId: ({ securityContext }) => {
    const tenant = securityContext?.tenant_code || securityContext?.cloud || 'default';
    return securityContext?.subscriptions ? `${tenant}__refresh` : tenant;
  },

  schemaVersion: ({ securityContext }) => {
    const tenant = securityContext?.tenant_code || securityContext?.cloud || 'default';
    const suffix = securityContext?.subscriptions ? '__refresh' : '';
    log.debug({ tenant, suffix }, 'schema_version');
    return `${tenant}${suffix}`;
  },

  preAggregationsSchema: ({ securityContext }) => {
    const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const tenant = securityContext?.tenant_code || securityContext?.cloud || 'default';
    const schema = `${env}_pre_agg_${tenant}`;
    log.debug({ tenant, schema }, 'pre_agg_schema');
    return schema;
  },

  logger: (msg, params) => {
    const isError = /error/i.test(msg);
    const level = isError ? 'error' : 'info';
    const { securityContext, ...rest } = params;

    log[level](
      { tenant: securityContext?.tenant_code, cloud: securityContext?.cloud, msg, ...rest },
      msg,
    );
  },

  scheduledRefreshConcurrency: parseInt(process.env.REFRESH_CONCURRENCY, 10) || 2,

  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 2,
    },
  },

  telemetry: false,
};
