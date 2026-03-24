cube('OrphanReturnManifest', {
  sql: `
    SELECT
      t.code            AS tenant,
      f.display_name    AS facility_name,
      rmi.id            AS rmi_id,
      rmi.created       AS created
    FROM return_manifest_item rmi
    INNER JOIN return_manifest rm ON rm.id = rmi.return_manifest_id
      AND rmi.shipping_package_id IS NULL
      AND rmi.reverse_pickup_id IS NULL
    INNER JOIN facility f ON f.id = rm.facility_id
    INNER JOIN party p ON f.id = p.id
    INNER JOIN tenant t ON p.tenant_id = t.id
  `,
  data_source: 'default',

  refresh_key: {
    sql: `SELECT CONCAT('${COMPILE_CONTEXT.securityContext.cloud}', ':', COALESCE(MAX(rmi.id), 0)) FROM return_manifest_item rmi`,
    every: '1 hour',
  },

  pre_aggregations: {
    main: {
      measures: [CUBE.orphan_count],
      dimensions: [CUBE.tenant, CUBE.facility_name],
      refresh_key: {
        sql: `SELECT CONCAT('${COMPILE_CONTEXT.securityContext.cloud}', ':', COALESCE(MAX(rmi.id), 0)) FROM return_manifest_item rmi`,
        every: '1 hour',
      },
    },
  },

  measures: {
    orphan_count: {
      type: 'count',
    },
  },

  dimensions: {
    rmi_id: {
      sql: `rmi_id`,
      type: 'number',
      primary_key: true,
    },

    tenant: {
      sql: `tenant`,
      type: 'string',
    },

    facility_name: {
      sql: `facility_name`,
      type: 'string',
    },

    created: {
      sql: `created`,
      type: 'time',
    },
  },
});
