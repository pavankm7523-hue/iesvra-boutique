async function test() {
  const query = "Ram Krishna Dwarika College";
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=15&countrycodes=in&addressdetails=1&extratags=1&namedetails=1&viewbox=84.6565,26.0945,85.6565,25.0945&bounded=0&accept-language=en`;

  console.log("Fetching:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data length:", data.length);
    console.log("First item:", JSON.stringify(data[0], null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
