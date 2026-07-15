async function testLocalSuggestions() {
  const query = "kesav memorial eng";
  const url = `http://localhost:8080/api/address-suggestions?query=${encodeURIComponent(query)}`;
  console.log("Fetching local suggestions for:", query);
  try {
    const res = await fetch(url);
    console.log("Local Suggestions Status:", res.status);
    const data = await res.json();
    console.log("Local Suggestions Response predictions count:", data.predictions?.length);
    console.log("Predictions:", JSON.stringify(data.predictions, null, 2));
  } catch (err) {
    console.error("Local Suggestions Error:", err);
  }
}

testLocalSuggestions();
