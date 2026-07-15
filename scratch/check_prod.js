async function check() {
  const r = await fetch('https://iesvra.com/');
  const html = await r.text();
  console.log('HTML length:', html.length);
  
  // Find JS script assets
  const matches = html.match(/\/assets\/[a-zA-Z0-9_-]+\.js/g) || [];
  console.log('JS assets found:', matches);
  
  for (const asset of matches) {
    const res = await fetch('https://iesvra.com' + asset);
    const content = await res.text();
    console.log(asset, 'length:', content.length);
    console.log(asset, 'has Crown:', content.includes('Crown'));
  }
}

check().catch(console.error);
