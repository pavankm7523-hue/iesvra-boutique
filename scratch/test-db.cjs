const fs = require('fs');
const process = require('process');

try {
  const env = fs.readFileSync('.env', 'utf-8');
  env.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
    }
  });
} catch (e) {
  console.log("No .env file found or failed to parse it, using default process.env");
}

const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

async function testInsertMetadata() {
  console.log("Testing inserting metadata to orders table...");
  const mockRecord = {
    id: "metadata_test_key",
    customer_name: "Metadata Store",
    customer_email: "metadata@iesvra.com",
    customer_phone: "0000000000",
    shipping_address: "Global System Configuration",
    items: [{ key: "test_value", time: Date.now() }],
    subtotal: 0,
    shipping: 0,
    total: 0,
    date: new Date().toISOString(),
    status: "Processing",
    payment_status: "Pending" // Added to satisfy non-null constraint
  };

  try {
    // Delete existing if any
    await fetch(`${url}/rest/v1/orders?id=eq.metadata_test_key`, {
      method: "DELETE",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    // Insert new
    const insertRes = await fetch(`${url}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(mockRecord)
    });

    console.log("Insert status:", insertRes.status, insertRes.statusText);
    if (insertRes.ok) {
      const data = await insertRes.json();
      console.log("Successfully inserted record:", data);
      
      // Fetch back to verify
      const fetchRes = await fetch(`${url}/rest/v1/orders?id=eq.metadata_test_key&select=*`, {
        method: "GET",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      });
      const list = await fetchRes.json();
      console.log("Fetched record:", list);
    } else {
      const text = await insertRes.text();
      console.error("Insert failed:", text);
    }
  } catch (e) {
    console.error("Error during metadata test:", e.message);
  }
}

testInsertMetadata();
