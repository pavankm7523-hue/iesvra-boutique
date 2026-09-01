import { useEffect, useState } from "react";

export type CouponType = "percentage" | "flat" | "free_shipping";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  type: CouponType;
  value: number;
  minimumOrder: number;
  maximumDiscount: number | null;
  firstOrderOnly: boolean;
  active: boolean;
  badge: string;
}

export function normalizeCoupon(value: any): Coupon {
  const type: CouponType = ["percentage", "flat", "free_shipping"].includes(value?.type)
    ? value.type
    : "percentage";
  return {
    id: String(value?.id || `coupon_${crypto.randomUUID()}`),
    code: String(value?.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
    title: String(value?.title || "").trim(),
    description: String(value?.description || "").trim(),
    type,
    value: Math.max(0, Number(value?.value) || 0),
    minimumOrder: Math.max(0, Number(value?.minimumOrder) || 0),
    maximumDiscount: value?.maximumDiscount == null || value.maximumDiscount === ""
      ? null
      : Math.max(0, Number(value.maximumDiscount) || 0),
    firstOrderOnly: Boolean(value?.firstOrderOnly),
    active: value?.active !== false,
    badge: String(value?.badge || "Verified").trim(),
  };
}

export function calculateCouponDiscount(coupon: Coupon, subtotal: number, shipping: number) {
  if (coupon.type === "free_shipping") {
    return { discount: shipping, freeShipping: true };
  }
  const raw = coupon.type === "percentage"
    ? Math.round(subtotal * coupon.value / 100)
    : coupon.value;
  const capped = coupon.maximumDiscount == null ? raw : Math.min(raw, coupon.maximumDiscount);
  return { discount: Math.min(subtotal, Math.max(0, capped)), freeShipping: false };
}

export function couponDiscountLabel(coupon: Coupon) {
  if (coupon.type === "free_shipping") return "FREE SHIPPING";
  if (coupon.type === "percentage") {
    return `${coupon.value}% OFF${coupon.maximumDiscount ? ` UP TO ₹${coupon.maximumDiscount}` : ""}`;
  }
  return `FLAT ₹${coupon.value} OFF`;
}

async function saveCoupons(coupons: Coupon[]) {
  const response = await fetch("/api/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coupons),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.error || "Coupon save failed.");
  return result;
}

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/coupons", { cache: "no-store" });
      const data = await response.json();
      setCoupons(Array.isArray(data) ? data.map(normalizeCoupon).filter((coupon) => coupon.code) : []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refresh().catch(console.error); }, []);

  const replaceCoupons = async (next: Coupon[]) => {
    await saveCoupons(next);
    setCoupons(next);
  };

  return { coupons, isLoading, refresh, replaceCoupons };
}
