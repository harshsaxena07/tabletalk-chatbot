// Load environment variables FIRST
require('dotenv').config();

const { Pool } = require('pg');

// Then use the environment variable
const pool = new Pool({
  connectionString: process.env.PG_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

module.exports = pool;
console.log("Connecting to DB:", process.env.PG_URL); // for debugging only
