fetch('https://iesvra.com/')
  .then(r => r.text())
  .then(html => {
    const scripts = html.match(/src="[^"]+index-[^"]+\.js"/g);
    console.log("Live index scripts:", scripts);
  });
