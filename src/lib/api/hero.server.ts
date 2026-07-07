import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import bundledHeroData from "../../data/hero.json";

export const HeroSettingsSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  buttonText: z.string(),
  buttonLink: z.string(),
  backgroundImageUrl: z.string(),
  isSpecialSale: z.boolean(),
  saleEndDate: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  productPrices: z.record(z.number()).optional(),
  exclusiveProductIds: z.array(z.string()).optional(),
});

export type HeroSettings = z.infer<typeof HeroSettingsSchema>;

const DATA_FILE = path.join(process.cwd(), "src", "data", "hero.json");

async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

const DEFAULT_BANNERS: HeroSettings[] = [{
  id: "default-1",
  title: "IESVRA",
  subtitle: "Quality Products, Best Prices, Everyday",
  buttonText: "SHOP NOW",
  buttonLink: "/shop",
  backgroundImageUrl: "/hero-bg.jpg",
  isSpecialSale: false,
  productIds: [],
  productPrices: {},
  exclusiveProductIds: [],
}];

async function readData(): Promise<HeroSettings[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed as HeroSettings[];
    }
    // Migrate old single object
    const migrated = { ...parsed, id: Date.now().toString() } as HeroSettings;
    await fs.writeFile(DATA_FILE, JSON.stringify([migrated], null, 2), "utf-8");
    return [migrated];
  } catch (e) {
    // Fallback to bundled data if file system read fails (e.g. on Vercel)
    if (Array.isArray(bundledHeroData) && bundledHeroData.length > 0) {
      return bundledHeroData as HeroSettings[];
    }
    return DEFAULT_BANNERS;
  }
}

export const getHeroBanners = createServerFn({ method: "GET" })
  .handler(async () => {
    return await readData();
  });

const NewBannerSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  buttonText: z.string(),
  buttonLink: z.string(),
  backgroundImageUrl: z.string(),
  isSpecialSale: z.boolean(),
  saleEndDate: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  productPrices: z.record(z.number()).optional(),
  exclusiveProductIds: z.array(z.string()).optional(),
});

export const addHeroBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    settings: NewBannerSchema,
    imageData: z.string().optional(),
    imageExt: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const banners = await readData();
    let { settings, imageData, imageExt } = data;
    
    if (imageData && imageExt) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir, { recursive: true }); }
      const fileName = `hero-banner-${Date.now()}${imageExt}`;
      const filePath = path.join(uploadsDir, fileName);
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      await fs.writeFile(filePath, base64Data, 'base64');
      settings.backgroundImageUrl = `/uploads/${fileName}`;
    }

    const newBanner: HeroSettings = {
      ...settings,
      id: Date.now().toString()
    };
    
    banners.push(newBanner);
    await fs.writeFile(DATA_FILE, JSON.stringify(banners, null, 2), "utf-8");
    return banners;
  });

export const updateHeroBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string(),
    settings: NewBannerSchema,
    imageData: z.string().optional(),
    imageExt: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const banners = await readData();
    let { id, settings, imageData, imageExt } = data;
    const index = banners.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Banner not found");
    
    if (imageData && imageExt) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      try { await fs.access(uploadsDir); } catch { await fs.mkdir(uploadsDir, { recursive: true }); }
      const fileName = `hero-banner-${Date.now()}${imageExt}`;
      const filePath = path.join(uploadsDir, fileName);
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      await fs.writeFile(filePath, base64Data, 'base64');
      settings.backgroundImageUrl = `/uploads/${fileName}`;
    }

    banners[index] = { ...settings, id };
    await fs.writeFile(DATA_FILE, JSON.stringify(banners, null, 2), "utf-8");
    return banners;
  });

export const deleteHeroBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    let banners = await readData();
    banners = banners.filter(b => b.id !== data.id);
    await fs.writeFile(DATA_FILE, JSON.stringify(banners, null, 2), "utf-8");
    return banners;
  });
