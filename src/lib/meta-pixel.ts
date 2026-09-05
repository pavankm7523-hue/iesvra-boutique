import type { CartItem } from "./cart";
import type { Order } from "./orders";

export const META_PIXEL_ID = "2135169644023595";
export const META_PIXEL_SCRIPT_ID = "iesvra-meta-pixel";
export const META_PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

// This runs in the document head before React hydrates. It creates Meta's queueing
// stub and queues `init`, but deliberately leaves PageView tracking to the router.
export const META_PIXEL_BOOTSTRAP_SCRIPT = `
(function (window, pixelId) {
  if (!window.fbq) {
    var fbq = function () {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
      } else {
        fbq.queue.push(arguments);
      }
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  } else if (!window._fbq) {
    window._fbq = window.fbq;
  }

  if (!window.__iesvraMetaPixelInitialized) {
    window.fbq("init", pixelId);
    window.__iesvraMetaPixelInitialized = true;
  }
})(window, ${JSON.stringify(META_PIXEL_ID)});
`;

type MetaContentsItem = {
  id: string;
  quantity: number;
  item_price: number;
};

type MetaFbq = ((
  command: string,
  eventOrPixelId: string,
  parameters?: Record<string, unknown>,
) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaFbq;
    _fbq?: MetaFbq;
    __iesvraMetaPixelInitialized?: boolean;
    __iesvraMetaLastPageView?: string;
    __iesvraMetaLastViewContent?: string;
    __iesvraMetaLastCheckout?: string;
  }
}

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

const asAmount = (value: number) => (Number.isFinite(value) ? Number(value.toFixed(2)) : 0);

const cartContents = (items: CartItem[]): MetaContentsItem[] =>
  items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    item_price: asAmount(item.price),
  }));

const cartContentIds = (items: CartItem[]) => Array.from(new Set(items.map((item) => item.id)));

function ensureMetaPixel(): MetaFbq | undefined {
  if (!isBrowser()) return undefined;

  if (!window.fbq) {
    const queuedFbq = ((...args: unknown[]) => {
      if (queuedFbq.callMethod) {
        queuedFbq.callMethod(...args);
      } else {
        queuedFbq.queue?.push(args);
      }
    }) as MetaFbq;
    queuedFbq.queue = [];
    queuedFbq.push = queuedFbq;
    queuedFbq.loaded = true;
    queuedFbq.version = "2.0";
    window.fbq = queuedFbq;
    window._fbq = queuedFbq;
  }

  if (!window.__iesvraMetaPixelInitialized) {
    window.fbq("init", META_PIXEL_ID);
    window.__iesvraMetaPixelInitialized = true;
  }

  if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = META_PIXEL_SCRIPT_SRC;
    document.head.appendChild(script);
  }

  return window.fbq;
}

function track(eventName: string, parameters?: Record<string, unknown>) {
  const fbq = ensureMetaPixel();
  if (!fbq) return;
  fbq("track", eventName, parameters);
}

export function trackMetaPageView(locationKey: string) {
  if (!isBrowser() || window.__iesvraMetaLastPageView === locationKey) return;
  window.__iesvraMetaLastPageView = locationKey;
  track("PageView");
}

export function trackMetaViewContent(product: { id: string; name: string; price: number }) {
  if (!isBrowser()) return;
  const eventKey = `${window.location.pathname}:${product.id}:${product.price}`;
  if (window.__iesvraMetaLastViewContent === eventKey) return;
  window.__iesvraMetaLastViewContent = eventKey;
  track("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: asAmount(product.price),
    currency: "INR",
  });
}

export function trackMetaAddToCart(item: Pick<CartItem, "id" | "name" | "price" | "quantity">) {
  track("AddToCart", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    contents: [{ id: item.id, quantity: item.quantity, item_price: asAmount(item.price) }],
    value: asAmount(item.price * item.quantity),
    currency: "INR",
  });
}

export function trackMetaInitiateCheckout(items: CartItem[], total: number) {
  if (!isBrowser() || items.length === 0) return;
  const eventKey = `${cartContentIds(items).join(",")}:${items.map((item) => `${item.id}-${item.quantity}-${item.price}`).join(",")}:${asAmount(total)}`;
  if (window.__iesvraMetaLastCheckout === eventKey) return;
  window.__iesvraMetaLastCheckout = eventKey;
  track("InitiateCheckout", {
    content_ids: cartContentIds(items),
    contents: cartContents(items),
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    value: asAmount(total),
    currency: "INR",
  });
}

export function trackMetaPurchase(order: Order) {
  if (!isBrowser() || !order.id) return;
  const storageKey = `iesvra_meta_purchase_${order.id}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
  } catch {
    // A blocked sessionStorage must not prevent a completed order from being tracked.
  }

  track("Purchase", {
    content_ids: cartContentIds(order.items),
    contents: cartContents(order.items),
    num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    value: asAmount(order.total),
    currency: "INR",
  });

  try {
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // The order ID remains the event's only identifier; storage is only duplicate protection.
  }
}
