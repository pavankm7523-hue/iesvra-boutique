const fs = require('fs'); 
let data = fs.readFileSync('c:/Users/Asus/Downloads/ishvara-89-boutique-main (2)/ishvara-89-boutique-main/src/lib/products.ts', 'utf8'); 
data = data.replace(/category: string;/g, 'categories: string[];'); 
data = data.replace(/\"category\": \"(.*?)\"/g, '\"categories\": [\"$1\"]'); 
fs.writeFileSync('c:/Users/Asus/Downloads/ishvara-89-boutique-main (2)/ishvara-89-boutique-main/src/lib/products.ts', data);
