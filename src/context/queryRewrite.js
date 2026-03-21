/**
 * Step 4 of the 4-function chain.
 * Injects a row-level tenant filter on every query. Server-side enforcement —
 * the client cannot bypass this.
 *
 * Shared warehouse queries are passed through without tenant filtering
 * (warehouse tables use their own access patterns).
 */
function queryRewrite(query, { securityContext: ctx }) {
  if (!ctx || !ctx.tenant_code) return query;

  query.filters = query.filters || [];
  query.filters.push({
    member: 'TABLE.tenant_code',
    operator: 'equals',
    values: [ctx.tenant_code],
  });

  return query;
}

module.exports = queryRewrite;
