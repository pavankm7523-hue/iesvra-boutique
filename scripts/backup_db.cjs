const fs = require('fs');
const path = require('path');

// Load environment variables from .env
function getEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        env[key] = val;
      }
    }
  }
  return env;
}

const envVars = getEnv();
const SUPABASE_URL = process.env.SUPABASE_URL || envVars.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || '';

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`[Backup] Starting snapshot at ${new Date().toISOString()}...`);
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    console.error(`[Backup Error] Supabase returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const allRecords = await res.json();
  const filePath = path.join(backupDir, `snapshot_${timestamp}.json`);
  const latestPath = path.join(backupDir, 'snapshot_latest.json');

  fs.writeFileSync(filePath, JSON.stringify(allRecords, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(allRecords, null, 2));

  console.log(`[Backup Success] Saved ${allRecords.length} records to:\n- ${filePath}\n- ${latestPath}`);
}

backup().catch(console.error);
