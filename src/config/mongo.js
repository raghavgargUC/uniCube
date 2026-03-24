const { MongoClient } = require('mongodb');
const log = require('../logger');

const CACHE_TTL_MS =
  (parseInt(process.env.MONGO_CACHE_TTL, 10) || 300) * 1000;

let client = null;
let db = null;

let _cache = { tenantCloud: null, subscriptions: null, ts: 0 };

async function init() {
  if (db) return;
  const uri = process.env.MONGO_URI;
  log.info({ uri: uri ? uri.replace(/\/\/.*@/, '//***@') : '(not set)' }, 'mongo_init_start');
  if (!uri) {
    log.warn('MONGO_URI not set — MongoRegistry disabled');
    return;
  }
  try {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(process.env.MONGO_DB || 'uniCube');
    log.info({ db: db.databaseName }, 'mongo_connected');
    await _refresh();
  } catch (err) {
    log.error({ error: err.message }, 'mongo_init_failed');
    client = null;
    db = null;
  }
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    log.info('mongo_closed');
  }
}

async function _refresh() {
  if (!db) {
    log.warn('mongo_refresh_skipped: db is null (not connected)');
    return;
  }
  const [tenantCloudDocs, subDocs] = await Promise.all([
    db.collection('tenant_cloud_map').find({}).toArray(),
    db.collection('model_subscriptions').find({ active: true }).toArray(),
  ]);

  log.debug(
    { tenantCloudDocs: tenantCloudDocs.length, rawTenants: tenantCloudDocs.map(d => d.tenant_code) },
    'mongo_raw_tenant_cloud_map',
  );
  log.debug(
    { subDocs: subDocs.length, rawSubs: subDocs.map(d => ({ t: d.tenant_code, m: d.model, a: d.active })) },
    'mongo_raw_model_subscriptions',
  );

  const tenantCloud = new Map();
  for (const doc of tenantCloudDocs) {
    tenantCloud.set(doc.tenant_code, doc.cloud.toLowerCase());
  }

  _cache = { tenantCloud, subscriptions: subDocs, ts: Date.now() };
  log.debug(
    { tenants: tenantCloud.size, activeSubs: subDocs.length },
    'mongo_cache_refreshed',
  );
}

function _ensureCache() {
  const age = Date.now() - _cache.ts;
  log.debug({ age, ttl: CACHE_TTL_MS, stale: age > CACHE_TTL_MS, dbConnected: !!db }, 'mongo_ensure_cache');
  if (age > CACHE_TTL_MS && db) {
    _refresh().catch((err) =>
      log.error({ error: err.message }, 'mongo_cache_refresh_failed'),
    );
  }
}

function getCloudForTenant(tenantCode) {
  _ensureCache();
  return _cache.tenantCloud?.get(tenantCode) || null;
}

/**
 * Returns one entry per tenant with a subscriptions map:
 *   [{ tenant_code, cloud, subscriptions: { ModelName: { refresh_every } } }]
 *
 * Only returns tenants that have at least one active subscription AND a cloud mapping.
 */
function getSubscribedTenants() {
  _ensureCache();
  if (!_cache.subscriptions) {
    log.debug({ dbConnected: !!db, cacheTs: _cache.ts }, 'mongo_no_subscriptions_in_cache');
    return [];
  }

  const tenantMap = new Map();
  for (const sub of _cache.subscriptions) {
    const cloud = _cache.tenantCloud?.get(sub.tenant_code);
    if (!cloud) {
      log.debug({ tenant_code: sub.tenant_code }, 'mongo_skip_no_cloud_mapping');
      continue;
    }

    if (!tenantMap.has(sub.tenant_code)) {
      tenantMap.set(sub.tenant_code, {
        tenant_code: sub.tenant_code,
        cloud,
        subscriptions: {},
      });
    }
    tenantMap.get(sub.tenant_code).subscriptions[sub.model] = {
      refresh_every: sub.refresh_every || '1 hour',
    };
  }

  const result = Array.from(tenantMap.values());
  log.debug(
    { matchedTenants: result.length, tenants: result.map(t => t.tenant_code) },
    'mongo_get_subscribed_tenants',
  );
  return result;
}

/**
 * Returns refresh_every for a specific tenant + model.
 * Falls back to '1 hour' if not found.
 */
function getRefreshEvery(tenantCode, model) {
  _ensureCache();
  if (!_cache.subscriptions) return '1 hour';
  const sub = _cache.subscriptions.find(
    (s) => s.tenant_code === tenantCode && s.model === model,
  );
  return sub?.refresh_every || '1 hour';
}

module.exports = {
  init,
  close,
  getCloudForTenant,
  getSubscribedTenants,
  getRefreshEvery,
};
