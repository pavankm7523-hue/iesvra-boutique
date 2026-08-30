import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/products.ts", import.meta.url), "utf8");
const marker = "const rawInitialProducts: Product[] = ";
const start = source.indexOf(marker) + marker.length;
const end = source.indexOf("\n];\n\n/**", start);

if (start < marker.length || end < 0) throw new Error("Could not locate the built-in product catalog.");

const builtIn = JSON.parse(source.slice(start, end + 2));
const liveResponse = await fetch("https://www.iesvra.com/api/products", { cache: "no-store" });
if (!liveResponse.ok) throw new Error(`Live catalog fetch failed (${liveResponse.status}).`);
const live = await liveResponse.json();

const mergedById = new Map(builtIn.map((product) => [product.id, product]));
for (const product of live) mergedById.set(product.id, product);
let catalog = [...mergedById.values()];

function mergeFamily(primaryId, memberIds, changes) {
  const primary = catalog.find((product) => product.id === primaryId)
    || catalog.find((product) => memberIds.includes(product.id));
  if (!primary) return;
  const memberSet = new Set(memberIds);
  catalog = catalog.filter((product) => !memberSet.has(product.id) || product.id === primary.id);
  catalog = catalog.map((product) => product.id === primary.id ? { ...product, ...changes } : product);
}

mergeFamily("prod_amz_B0FJLRDFK2", [
  "prod_amz_B0FJLRDFK2", "prod_amz_B0FKMZY6L3", "prod_amz_B0FKN5CB6D",
], {
  name: "Reusable Popsicle Mould Set – 6 Cavity",
  sub: "6-Cavity BPA-Free Ice Cream & Kulfi Moulds with Stand | Reusable Frozen Treat Maker",
  colors: [], variants: undefined,
});

mergeFamily("prod_amz_B0FMNFV2DJ", [
  "prod_amz_B0FMNFV2DJ", "prod_amz_B0FMNFZ6KS", "prod_amz_B0FMNT8XSN",
], {
  name: "Double Tube Door Bottom Seal Guard",
  sub: "Noise Reduction, Dust & Insect Blocker | Select the required pack quantity",
  price: 0, mrp: 0, colors: [],
  variants: [
    { id: "door-seal-4", label: "Set of 4", price: 0, mrp: 0 },
    { id: "door-seal-5", label: "Set of 5", price: 0, mrp: 0 },
    { id: "door-seal-7", label: "Set of 7", price: 0, mrp: 0 },
  ],
});

mergeFamily("prod_amz_B0FMNWLK3C", [
  "prod_amz_B0FMNWLK3C", "prod_amz_B0FMNFDX1Z", "prod_amz_B0FMNJ7LVF", "prod_amz_B0FKMKZLBJ",
], {
  name: "Door Mat for Home Entrance",
  sub: "Anti-Slip Waterproof Dust-Control Door Mat | Select the required set quantity",
  price: 690, mrp: 1299, colors: [],
  variants: [
    { id: "door-mat-1", label: "Single", price: 897, mrp: 1999 },
    { id: "door-mat-3", label: "Set of 3", price: 690, mrp: 1299 },
    { id: "door-mat-6", label: "Set of 6", price: 1845, mrp: 2598 },
    { id: "door-mat-8", label: "Set of 8", price: 897, mrp: 1999 },
  ],
});

mergeFamily("prod_amz_B0FNN49PMX", [
  "prod_amz_B0FNN2D5CD", "prod_amz_B0FNN4WQNQ", "prod_amz_B0FNN66P5B", "prod_amz_B0FNN49PMX",
  "prod_amz_B0FNN6BRJD", "prod_amz_B0FNN7W66B", "prod_amz_B0FNN7Q41H", "prod_amz_B0FNN672TC",
], {
  name: "400ml Glass Water Bottle with Silicone Protective Sleeve",
  sub: "Leak Proof | BPA Free | Travel Friendly | Select Pack of 1 or Pack of 2",
  price: 449, mrp: 673, colors: [],
  variants: [
    { id: "glass-bottle-1", label: "Pack of 1", price: 449, mrp: 673, unitPriceText: "(₹449 / bottle)" },
    { id: "glass-bottle-2", label: "Pack of 2", price: 809, mrp: 1213, unitPriceText: "(₹404.50 / bottle)" },
  ],
});

const summary = {
  liveBefore: live.length,
  builtIn: builtIn.length,
  mergedAfterConsolidation: catalog.length,
  variantProducts: catalog.filter((product) => product.variants?.length).map((product) => ({
    id: product.id,
    name: product.name,
    options: product.variants.map((variant) => variant.label),
  })),
};

if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify(summary, null, 2));
  console.log("Dry run only. Pass --apply to replace the live catalog.");
  process.exit(0);
}

const saveResponse = await fetch("https://www.iesvra.com/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(catalog),
});
const result = await saveResponse.json();
if (!saveResponse.ok || !result.success) throw new Error(result.error || `Catalog save failed (${saveResponse.status}).`);
console.log(JSON.stringify({ ...summary, save: result }, null, 2));
