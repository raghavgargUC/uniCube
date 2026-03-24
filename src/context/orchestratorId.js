/**
 * Step 2 of the 4-function chain.
 * Returns a unique orchestrator key per cloud so that each cloud gets
 * its own cache slab and refresh queue. The shared warehouse uses a
 * single shared orchestrator context.
 */
function contextToOrchestratorId({ securityContext: ctx, dataSource }) {
  console.log("Orchestrator for cloud:", ctx?.cloud, "dataSource:", dataSource);
  if (dataSource === 'shared_warehouse') return 'shared';
  return ctx.cloud;
}

module.exports = contextToOrchestratorId;
