import { createFileRoute } from "@tanstack/react-router";
import { backupProductToStorage, getMetadataFromDb, saveMetadataToDb } from "@/lib/db.server";
import { requireAdmin } from "@/lib/session.server";

type CatalogProduct = Record<string, any> & {
  id: string;
  name: string;
  image: string;
};

function validateProduct(value: any): CatalogProduct {
  if (!value || typeof value !== "object") throw new Error("Product payload is missing.");
  const id = typeof value.id === "string" ? value.id.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const gallery = Array.isArray(value.gallery)
    ? value.gallery.filter((item: any) => item && typeof item.url === "string" && item.url.trim())
    : [];
  const image = gallery[0]?.url || (typeof value.image === "string" ? value.image.trim() : "");

  if (!id) throw new Error("Product ID is required.");
  if (!name) throw new Error("Product name is required.");
  if (!image) throw new Error(`Product image is required for ${name}.`);
  if (!Number.isFinite(Number(value.price)) || Number(value.price) < 0) {
    throw new Error(`Invalid selling price for ${name}.`);
  }
  if (!Number.isFinite(Number(value.mrp)) || Number(value.mrp) < 0) {
    throw new Error(`Invalid MRP for ${name}.`);
  }

  return {
    ...value,
    id,
    name,
    image,
    gallery: gallery.length > 0 ? gallery : [{ id: "main", type: "image", url: image }],
    categories: Array.isArray(value.categories) && value.categories.length > 0
      ? value.categories
      : ["Uncategorized"],
    colors: Array.isArray(value.colors) ? value.colors : [],
  };
}

function mergeById(existing: any[], incoming: CatalogProduct[]) {
  const merged = new Map(existing.filter((item) => item?.id).map((item) => [item.id, item]));
  for (const product of incoming) merged.set(product.id, product);
  return [...merged.values()];
}

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalizeJson(item)]),
    );
  }
  return value;
}

function productsMatch(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(canonicalizeJson(actual)) === JSON.stringify(canonicalizeJson(expected));
}

const PRODUCT_TOMBSTONES_KEY = "global_product_tombstones";

function normalizeTombstones(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map((id) => id.trim()))]
    : [];
}

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const products = await getMetadataFromDb("global_products");
          return new Response(JSON.stringify(products || []), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
              "Pragma": "no-cache",
              "Expires": "0",
            },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        const forbidden = requireAdmin(request); if (forbidden) return forbidden;
        try {
          const payload = await request.json();
          let list: any[];
          let savedProduct: CatalogProduct | undefined;
          let deletedProductId: string | undefined;
          let productToDelete: CatalogProduct | undefined;
          let productsToVerify: CatalogProduct[] = [];
          const current = await getMetadataFromDb("global_products");
          const existing = Array.isArray(current) ? current : [];
          const storedTombstones = normalizeTombstones(await getMetadataFromDb(PRODUCT_TOMBSTONES_KEY));
          const tombstones = new Set(storedTombstones);
          let nextTombstones = storedTombstones;

          if (Array.isArray(payload)) {
            // Only allow the legacy bootstrap format when the catalog is
            // genuinely empty. A cached admin tab must never replace or merge
            // a stale full snapshot into a live catalog.
            if (existing.length > 0) {
              return new Response(JSON.stringify({ error: "Stale full-catalog save blocked. Refresh the admin panel and retry." }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
              });
            }
            list = payload.map(validateProduct).filter((product: CatalogProduct) => !tombstones.has(product.id));
          } else if (payload?.action === "bulkUpsert" && Array.isArray(payload.products)) {
            const allowedProducts = payload.products
              .map(validateProduct)
              .filter((product: CatalogProduct) => !tombstones.has(product.id));
            productsToVerify = allowedProducts;
            list = mergeById(existing, allowedProducts);
          } else if (["create", "update", "upsert"].includes(payload?.action) && payload.product?.id) {
            savedProduct = validateProduct(payload.product);
            productsToVerify = [savedProduct];
            const previous = existing.find((product: any) => product?.id === savedProduct!.id);

            if (payload.action === "create" && previous) {
              return new Response(JSON.stringify({ error: "A product with this ID already exists. Refresh before saving again." }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (payload.action === "update" && !previous) {
              return new Response(JSON.stringify({ error: "This product no longer exists. Refresh the admin panel before saving." }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (previous?.asin && savedProduct.asin && previous.asin !== savedProduct.asin) {
              return new Response(JSON.stringify({ error: "Product identity conflict: ASIN does not match the existing record." }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
              });
            }

            list = [savedProduct, ...existing.filter((product: any) => product?.id !== savedProduct!.id)];
            // An explicit admin create/upsert is the only operation allowed to
            // intentionally restore a previously deleted product ID.
            if (payload.action !== "update" && tombstones.has(savedProduct.id)) {
              nextTombstones = storedTombstones.filter((id) => id !== savedProduct!.id);
            }
          } else if (payload?.action === "delete" && payload.id) {
            deletedProductId = String(payload.id).trim();
            productToDelete = existing.find((product: CatalogProduct) => product?.id === deletedProductId);
            if (productToDelete) {
              // A deletion is blocked unless the complete product is safely
              // copied outside the catalog database first.
              await backupProductToStorage(productToDelete, "pre-delete");
            }
            list = existing.filter((product: any) => product?.id !== deletedProductId);
            nextTombstones = normalizeTombstones([...storedTombstones, deletedProductId]);
          } else {
            return new Response(JSON.stringify({ error: "Invalid product mutation." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const success = await saveMetadataToDb("global_products", list);
          if (success && JSON.stringify(nextTombstones) !== JSON.stringify(storedTombstones)) {
            const tombstonesSaved = await saveMetadataToDb(PRODUCT_TOMBSTONES_KEY, nextTombstones);
            if (!tombstonesSaved) {
              return new Response(JSON.stringify({ error: "Product catalog changed, but deletion protection could not be saved." }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            }
          }
          let verifiedCount = 0;
          if (success && productsToVerify.length > 0) {
            const persisted = await getMetadataFromDb("global_products");
            verifiedCount = Array.isArray(persisted)
              ? productsToVerify.filter((expected) => {
                  const actual = persisted.find((product: CatalogProduct) => product?.id === expected.id);
                  return Boolean(actual && productsMatch(actual, expected));
                }).length
              : 0;
            if (verifiedCount !== productsToVerify.length) {
              console.error("[api/products] persistence verification mismatch", {
                expectedIds: productsToVerify.map((product) => product.id),
                persistedIds: Array.isArray(persisted)
                  ? persisted.map((product: CatalogProduct) => product?.id).filter(Boolean)
                  : [],
              });
              return new Response(JSON.stringify({ error: "Product save verification failed. The catalog was not confirmed; please retry." }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          let backups: Array<{ productId: string; path: string }> = [];
          if (success && productsToVerify.length > 0) {
            backups = await Promise.all(productsToVerify.map(async (product) => {
              const operation = payload?.action === "create"
                ? "create"
                : payload?.action === "update"
                  ? "update"
                  : "upsert";
              const backup = await backupProductToStorage(product, operation);
              return { productId: product.id, path: backup.path };
            }));
          }

          if (success && deletedProductId) {
            const [persisted, persistedTombstones] = await Promise.all([
              getMetadataFromDb("global_products"),
              getMetadataFromDb(PRODUCT_TOMBSTONES_KEY),
            ]);
            const productStillExists = Array.isArray(persisted)
              && persisted.some((product: CatalogProduct) => product?.id === deletedProductId);
            const tombstoneExists = normalizeTombstones(persistedTombstones).includes(deletedProductId);
            if (productStillExists || !tombstoneExists) {
              console.error("[api/products] deletion verification mismatch", {
                deletedProductId,
                productStillExists,
                tombstoneExists,
              });
              return new Response(JSON.stringify({ error: "Product deletion was not confirmed by the database; please retry." }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          return new Response(JSON.stringify({ success, count: list.length, verifiedCount, backupCount: backups.length, backups, deletedId: deletedProductId, product: savedProduct && {
            id: savedProduct.id,
            name: savedProduct.name,
            image: savedProduct.image,
          } }), {
            status: success ? 200 : 500,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
