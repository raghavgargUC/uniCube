/**
 * Step 4 of the 4-function chain.
 * Injects a row-level tenant filter on every query. Server-side enforcement —
 * the client cannot bypass this.
 *
 * Extracts the cube name from the query's measures/dimensions and appends
 * a .tenant filter so each tenant only sees their own data.
 */
function queryRewrite(query, { securityContext: ctx }) {
  if (!ctx || !ctx.tenant_code) return query;

  const firstMember =
    (query.measures && query.measures[0]) ||
    (query.dimensions && query.dimensions[0]);

  if (!firstMember) return query;

  const cubeName = firstMember.split('.')[0];

  query.filters = query.filters || [];
  query.filters.push({
    member: `${cubeName}.tenant`,
    operator: 'equals',
    values: [ctx.tenant_code],
  });

  return query;
}

module.exports = queryRewrite;
