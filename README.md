# uniCube

Cube.js analytics layer with multi-tenant authentication, session management, and multi-datasource routing.

## Project Structure

```
uniCube/
├── cube.js                        # Main Cube config — wires all modules
├── index.js                       # Server entrypoint + Express middleware
├── src/
│   ├── config/
│   │   ├── index.js               # Env loader, exports all config
│   │   └── datasources.js         # CLOUD_HOSTS map + warehouse config
│   ├── auth/
│   │   ├── checkAuth.js           # JWT verification (chain step 1)
│   │   └── tokenBridge.js         # JWT parse middleware → { tenant_code, cloud, role }
│   ├── context/
│   │   ├── index.js               # Barrel export
│   │   ├── orchestratorId.js      # Per-cloud cache isolation (chain step 2)
│   │   ├── driverFactory.js       # Multi-datasource routing (chain step 3)
│   │   └── queryRewrite.js        # Row-level tenant filter (chain step 4)
│   └── refresh/
│       └── scheduledContexts.js   # Auto-generates per-cloud refresh threads
├── model/                         # Cube data models (schema)
│   ├── WarehouseQC.js             # 10-min refresh, ops critical
│   ├── SLASummary.js              # 1-hour refresh, dashboard reporting
│   ├── SLARollup.js               # dbt output reader (shared warehouse)
│   ├── AdHocMetrics.js            # On-demand TTL, no background cost
│   └── SKUDetails.js              # Daily refresh, reference data
├── docker-compose.yml             # Cube + CubeStore + refresh worker
├── .env.example                   # Environment variable template
└── package.json
```

## Architecture — 4-Function Chain

Every request flows through four functions in sequence:

| Step | Function                    | Purpose                                          |
|------|-----------------------------|--------------------------------------------------|
| 1    | `checkAuth`                 | Verify JWT → extract `{ tenant_code, cloud, role }` |
| 2    | `contextToOrchestratorId`   | Route to per-cloud cache slab + refresh queue     |
| 3    | `driverFactory`             | Map `cloud` → MySQL host or shared warehouse      |
| 4    | `queryRewrite`              | Inject `WHERE tenant_code = ?` on every query     |

## Auth

This service **does not issue tokens**. JWTs are issued by Uniware/Orchestrator. Cube only verifies and parses them.

- `checkAuth` — Cube-internal JWT verification, populates `securityContext`
- `tokenBridge` — Express middleware, validates JWT and exposes `req.contextInfo`

## Datasources

| Type             | Datasource          | Driver   | Pool Control         |
|------------------|---------------------|----------|----------------------|
| Per-cloud MySQL  | `default`           | MySQL    | `pool.max` per host  |
| Shared warehouse | `shared_warehouse`  | Postgres | Fixed pool           |

## Getting Started

```bash
# 1. Copy env template
cp .env.example .env
# Edit .env with your credentials and cloud host configs

# 2. Configure cloud hosts
# Edit src/config/datasources.js — add your CLOUD_HOSTS entries

# 3. Run locally
npm run dev

# 4. Or with Docker
docker-compose up
```

## TODO

- [ ] Populate `CLOUD_HOSTS` in `src/config/datasources.js` with actual host IPs and pool sizes
- [ ] Update model files in `model/` with actual table schemas, measures, and dimensions
- [ ] Add dbt project for transformation layer (rolling windows, late corrections)
- [ ] Set up `CUBEJS_API_SECRET` shared between Cube and Uniware backend
