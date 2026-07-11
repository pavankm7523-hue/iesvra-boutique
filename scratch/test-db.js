const process = require('process');
// Load environment variables from .env
require('dotenv').config();

const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!url || !key) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const tables = ['orders', 'products', 'categories', 'registered_users', 'users', 'metadata', 'settings', 'kv'];

async function checkTables() {
  console.log("Checking Supabase tables at:", url);
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        method: "GET",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      console.log(`Table '${table}': status = ${res.status} (${res.statusText})`);
    } catch (e) {
      console.log(`Table '${table}': error = ${e.message}`);
    }
  }
}

checkTables();
