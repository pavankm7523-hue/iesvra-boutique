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

let memoryBanners: HeroSettings[] | null = null;

async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}
  }
}

const DEFAULT_BANNERS: HeroSettings[] = [{
  id: "default-1",
  title: "IESVRA",
  subtitle: "Quality Products, Best Prices, Everyday",
  buttonText: "SHOP NOW",
  buttonLink: "/shop",
  backgroundImageUrl: "/hero-banner-new.png",
  isSpecialSale: false,
  productIds: [],
  productPrices: {},
  exclusiveProductIds: [],
}];

async function readData(): Promise<HeroSettings[]> {
  if (memoryBanners) return memoryBanners;
  await ensureDataDir();
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      memoryBanners = parsed as HeroSettings[];
      return memoryBanners;
    }
    const migrated = { ...parsed, id: Date.now().toString() } as HeroSettings;
    try { await fs.writeFile(DATA_FILE, JSON.stringify([migrated], null, 2), "utf-8"); } catch {}
    memoryBanners = [migrated];
    return memoryBanners;
  } catch (e) {
    if (Array.isArray(bundledHeroData) && bundledHeroData.length > 0) {
      memoryBanners = bundledHeroData as HeroSettings[];
      return memoryBanners;
    }
    memoryBanners = DEFAULT_BANNERS;
    return memoryBanners;
  }
}

async function writeData(banners: HeroSettings[]): Promise<void> {
  memoryBanners = banners;
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(banners, null, 2), "utf-8");
  } catch (e) {
    console.warn("[hero.server] Could not persist banners to disk (read-only environment):", e);
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
  backgroundImageUrl: z.string().optional().default(""),
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
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const fileName = `hero-banner-${Date.now()}${imageExt}`;
        const filePath = path.join(uploadsDir, fileName);
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        await fs.writeFile(filePath, base64Data, 'base64');
        settings.backgroundImageUrl = `/uploads/${fileName}`;
      } catch (e) {
        console.warn("[hero.server] Disk write failed, using base64 Data URL fallback:", e);
        settings.backgroundImageUrl = imageData;
      }
    } else if (!settings.backgroundImageUrl && imageData) {
      settings.backgroundImageUrl = imageData;
    }

    if (!settings.backgroundImageUrl) {
      settings.backgroundImageUrl = "/hero-banner-new.png";
    }

    const newBanner: HeroSettings = {
      ...settings,
      backgroundImageUrl: settings.backgroundImageUrl,
      id: Date.now().toString()
    };
    
    banners.push(newBanner);
    await writeData(banners);
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
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const fileName = `hero-banner-${Date.now()}${imageExt}`;
        const filePath = path.join(uploadsDir, fileName);
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        await fs.writeFile(filePath, base64Data, 'base64');
        settings.backgroundImageUrl = `/uploads/${fileName}`;
      } catch (e) {
        console.warn("[hero.server] Disk write failed, using base64 Data URL fallback:", e);
        settings.backgroundImageUrl = imageData;
      }
    } else if (!settings.backgroundImageUrl && imageData) {
      settings.backgroundImageUrl = imageData;
    }

    if (!settings.backgroundImageUrl) {
      settings.backgroundImageUrl = banners[index].backgroundImageUrl || "/hero-banner-new.png";
    }

    banners[index] = {
      ...settings,
      backgroundImageUrl: settings.backgroundImageUrl,
      id
    };
    await writeData(banners);
    return banners;
  });

export const deleteHeroBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    let banners = await readData();
    banners = banners.filter(b => b.id !== data.id);
    await writeData(banners);
    return banners;
  });
