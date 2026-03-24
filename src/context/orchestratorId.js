/**
 * Returns a unique orchestrator key per tenant so that each tenant gets
 * its own cache slab, refresh queue, and pre-aggregation lifecycle.
 * The shared warehouse uses a single shared orchestrator context.
 */
function contextToOrchestratorId({ securityContext: ctx, dataSource }) {
  if (dataSource === 'shared_warehouse') return 'shared';
  return ctx.tenant_code || ctx.cloud || 'default';
}

module.exports = contextToOrchestratorId;
