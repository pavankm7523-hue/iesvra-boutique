import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import bundledHeroData from "../../data/hero.json";
import { getMetadataFromDb, saveMetadataToDb } from "../db.server";

export const HeroSettingsSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  buttonText: z.string(),
  buttonLink: z.string(),
  backgroundImageUrl: z.string(),
  isSpecialSale: z.boolean(),
  campaignType: z.enum(["standard", "sale", "festival", "special-offer"]).optional(),
  isActive: z.boolean().optional(),
  saleEndDate: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  productPrices: z.record(z.any()).optional(),
  exclusiveProductIds: z.array(z.string()).optional(),
});

export type HeroSettings = z.infer<typeof HeroSettingsSchema>;

const DATA_FILE = path.join(process.cwd(), "src", "data", "hero.json");

let memoryBanners: HeroSettings[] | null = null;

const DEFAULT_BANNERS: HeroSettings[] = [{
  id: "default-1",
  title: "IESVRA — Smart Shopping, Faster Delivery!",
  subtitle: "Shop More. Save More. Get More!",
  buttonText: "DOWNLOAD APP & SHOP NOW!",
  buttonLink: "/shop",
  backgroundImageUrl: "/hero-banner-original.png",
  isSpecialSale: false,
  campaignType: "standard",
  isActive: true,
  productIds: [],
  productPrices: {},
  exclusiveProductIds: [],
}];

async function readData(): Promise<HeroSettings[]> {
  if (memoryBanners) return memoryBanners;

  try {
    const dbData = await getMetadataFromDb("global_hero_banners");
    if (Array.isArray(dbData) && dbData.length > 0) {
      memoryBanners = dbData as HeroSettings[];
      return memoryBanners;
    }
  } catch (e) {
    console.warn("[hero.server] Supabase read error:", e);
  }

  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryBanners = parsed as HeroSettings[];
      return memoryBanners;
    }
  } catch {}

  if (Array.isArray(bundledHeroData) && bundledHeroData.length > 0) {
    memoryBanners = bundledHeroData as HeroSettings[];
    return memoryBanners;
  }

  memoryBanners = DEFAULT_BANNERS;
  return memoryBanners;
}

async function writeData(banners: HeroSettings[]): Promise<void> {
  memoryBanners = banners;

  let savedToDb = false;
  try {
    savedToDb = await saveMetadataToDb("global_hero_banners", banners);
    if (savedToDb) {
      console.log("[hero.server] Saved hero banners to Supabase DB successfully!");
    } else {
      console.error("[hero.server] saveMetadataToDb returned false when writing global_hero_banners!");
    }
  } catch (e) {
    console.error("[hero.server] Error in saveMetadataToDb:", e);
  }

  let savedToDisk = false;
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(banners, null, 2), "utf-8");
    savedToDisk = true;
  } catch (e) {
    console.warn("[hero.server] Local disk write skipped (read-only filesystem on Vercel):", e);
  }

  if (!savedToDb && !savedToDisk) {
    throw new Error("Failed to persist hero banners: database write failed and filesystem is read-only.");
  }
}

export const getHeroBanners = createServerFn({ method: "GET" })
  .handler(async () => {
    return await readData();
  });

const NewBannerSchema = z.object({
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  buttonText: z.string().optional().default("SHOP NOW"),
  buttonLink: z.string().optional().default("/shop"),
  backgroundImageUrl: z.string().optional().default(""),
  isSpecialSale: z.boolean().optional().default(false),
  campaignType: z.enum(["standard", "sale", "festival", "special-offer"]).optional().default("standard"),
  isActive: z.boolean().optional().default(true),
  saleEndDate: z.string().optional().nullable(),
  productIds: z.array(z.string()).optional().default([]),
  productPrices: z.record(z.any()).optional().default({}),
  exclusiveProductIds: z.array(z.string()).optional().default([]),
});

export const addHeroBanner = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const banners = await readData();
    let { settings, imageData, imageExt } = data || {};
    if (!settings) settings = {};

    if (imageData) {
      if (imageData.startsWith("data:")) {
        try {
          const { url, key } = getSupabaseConfig();
          const base64Data = imageData.replace(/^data:[^;]+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          const ext = imageExt || ".jpg";
          const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
          
          const uploadRes = await fetch(`${url}/storage/v1/object/iesvra-media/${fileName}`, {
            method: "POST",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": ext === ".png" ? "image/png" : "image/jpeg",
              "x-upsert": "true"
            },
            body: buffer
          });

          if (uploadRes.ok) {
            settings.backgroundImageUrl = `${url}/storage/v1/object/public/iesvra-media/${fileName}`;
          } else {
            console.error("[hero.server] Supabase Storage upload failed, fallback to imageData");
            settings.backgroundImageUrl = imageData;
          }
        } catch (e) {
          console.warn("[hero.server] Supabase Storage error:", e);
          settings.backgroundImageUrl = imageData;
        }
      } else {
        settings.backgroundImageUrl = imageData;
      }
    }

    if (!settings.backgroundImageUrl) {
      settings.backgroundImageUrl = "/hero-banner-new.png";
    }

    const newBanner: HeroSettings = {
      id: Date.now().toString(),
      title: settings.title || "IESVRA",
      subtitle: settings.subtitle || "",
      buttonText: settings.buttonText || "SHOP NOW",
      buttonLink: settings.buttonLink || "/shop",
      backgroundImageUrl: settings.backgroundImageUrl,
      isSpecialSale: Boolean(settings.isSpecialSale),
      campaignType: settings.campaignType || (settings.isSpecialSale ? "sale" : "standard"),
      isActive: settings.isActive !== false,
      saleEndDate: settings.saleEndDate || undefined,
      productIds: settings.productIds || [],
      productPrices: settings.productPrices || {},
      exclusiveProductIds: settings.exclusiveProductIds || []
    };
    
    banners.push(newBanner);
    await writeData(banners);
    return banners;
  });

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    throw new Error("Supabase credentials missing.");
  }
  return { url, key };
}

export const updateHeroBanner = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const banners = await readData();
    let { id, settings, imageData, imageExt } = data || {};
    if (!settings) settings = {};
    
    const index = banners.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Banner not found");
    
    if (imageData) {
      if (imageData.startsWith("data:")) {
        try {
          const { url, key } = getSupabaseConfig();
          const base64Data = imageData.replace(/^data:[^;]+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          const ext = imageExt || ".jpg";
          const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
          
          const uploadRes = await fetch(`${url}/storage/v1/object/iesvra-media/${fileName}`, {
            method: "POST",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": ext === ".png" ? "image/png" : "image/jpeg",
              "x-upsert": "true"
            },
            body: buffer
          });

          if (uploadRes.ok) {
            settings.backgroundImageUrl = `${url}/storage/v1/object/public/iesvra-media/${fileName}`;
          } else {
            console.error("[hero.server] Supabase Storage upload failed in update, fallback to imageData");
            settings.backgroundImageUrl = imageData;
          }
        } catch (e) {
          console.warn("[hero.server] Supabase Storage error in update:", e);
          settings.backgroundImageUrl = imageData;
        }
      } else {
        settings.backgroundImageUrl = imageData;
      }
    }

    if (!settings.backgroundImageUrl) {
      settings.backgroundImageUrl = banners[index].backgroundImageUrl || "/hero-banner-new.png";
    }

    banners[index] = {
      ...banners[index],
      ...settings,
      backgroundImageUrl: settings.backgroundImageUrl,
      id
    };
    await writeData(banners);
    return banners;
  });

export const deleteHeroBanner = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    let banners = await readData();
    const { id } = data || {};
    banners = banners.filter(b => b.id !== id);
    await writeData(banners);
    return banners;
  });
