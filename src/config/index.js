require('dotenv').config();

const { UNIWARE_CONFIG, WAREHOUSE_CONFIG } = require('./datasources');

module.exports = {
  UNIWARE_CONFIG,
  WAREHOUSE_CONFIG,

  CUBEJS_API_SECRET: process.env.CUBEJS_API_SECRET,
  CUBEJS_DEV_MODE: process.env.CUBEJS_DEV_MODE === 'true',
  CUBEJS_DB_USER: process.env.DB_USER,
  CUBEJS_DB_PASS: process.env.DB_PASS,

  PORT: parseInt(process.env.PORT, 10) || 4000,
};
