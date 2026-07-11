// 15-Minute Express Delivery Eligibility Calculator
// Warehouse: Dr. R.N. Singh Road, Kankarbagh Main Road, Patna, Bihar 800020

export const WAREHOUSE_LAT = 25.5945;
export const WAREHOUSE_LON = 85.1565;
export const MAX_EXPRESS_DISTANCE_KM = 15;

export interface GeocodeResult {
  lat: number;
  lon: number;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface DeliveryEligibility {
  eligible: boolean;
  distance: number | null;
  error: string | null;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Retrieves the Google Maps API key from environment variables or localStorage.
 */
export function getGoogleApiKey(): string {
  if (typeof window !== "undefined") {
    return (
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      localStorage.getItem("IESVRA_google_maps_key") ||
      ""
    );
  }
// In-memory cache for resolved Google Maps URLs
export const resolvedUrlsCache = new Map<string, GeocodeResult>();

/**
 * Fetches address autocomplete suggestions.
 * Tries Google Places API if a key is provided and loaded, otherwise falls back to OpenStreetMap Nominatim.
 */
export async function fetchAddressSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < 3) return [];

  const trimmedQuery = query.trim();

  // 1. Detect if query is coordinates like "lat, lon"
  const coordsRegex = /^([-+]?[0-9]+\.[0-9]+)\s*,\s*([-+]?[0-9]+\.[0-9]+)$/;
  const coordsMatch = trimmedQuery.match(coordsRegex);
  if (coordsMatch) {
    try {
      const lat = parseFloat(coordsMatch[1]);
      const lon = parseFloat(coordsMatch[2]);
      const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en&addressdetails=1`;
      const res = await fetch(reverseUrl, { headers: { "User-Agent": "IESVRA-Boutique-App/1.0" } });
      if (res.ok) {
        const data = await res.json();
        const displayName = `📍 Coordinates: ${data.display_name}`;
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.street || "";
        const houseNumber = addr.house_number || "";
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
        const city = addr.city || addr.town || addr.village || addr.county || "";
        const state = addr.state || "";
        const pincode = addr.postcode || "";

        resolvedUrlsCache.set(displayName, {
          lat,
          lon,
          line1: [houseNumber, road].filter(Boolean).join(" ") || trimmedQuery,
          line2: suburb,
          city,
          state,
          pincode,
        });
        return [displayName];
      }
    } catch (e) {
      console.error("[delivery] Coordinates resolution failed:", e);
    }
  }

  // 2. Detect if the query is a Google Maps share URL or direct URL
  const isMapsUrl =
    /https?:\/\/(maps\.(google|app\.goo)\.gl|goo\.gl\/maps|www\.google\.com\/maps)/i.test(trimmedQuery);

  if (isMapsUrl) {
    try {
      const res = await fetch(`/api/resolve-maps-url?url=${encodeURIComponent(trimmedQuery)}`);
      if (!res.ok) throw new Error("Failed to resolve Google Maps link");
      const data = await res.json();
      if (data && data.lat && data.lon) {
        const displayName = `📍 ${data.displayName}`;
        resolvedUrlsCache.set(displayName, {
          lat: data.lat,
          lon: data.lon,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        });
        return [displayName];
      }
    } catch (e) {
      console.error("[delivery] Failed to resolve maps URL suggestion:", e);
    }
  }

  const apiKey = getGoogleApiKey();
  
  // 2. Try Google Places if SDK is loaded
  if (typeof window !== "undefined" && (window as any).google?.maps?.places) {
    try {
      const service = new (window as any).google.maps.places.AutocompleteService();
      const predictions = await new Promise<any[]>((resolve, reject) => {
        service.getPlacePredictions(
          { input: query, componentRestrictions: { country: "in" } },
          (results: any, status: any) => {
            if (status === "OK" && results) {
              resolve(results);
            } else {
              reject(status);
            }
          }
        );
      });
      return predictions.map((p) => p.description);
    } catch (e) {
      console.warn("Google Places Autocomplete failed, falling back to Nominatim:", e);
    }
  }

  // 3. Fallback to OpenStreetMap Nominatim — search ALL of India (countrycodes=in),
  // no viewbox/bounded restriction. addressdetails=1 ensures city/state/pincode fields
  // are populated when the user selects a suggestion.
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=5&countrycodes=in&addressdetails=1&accept-language=en`;
    console.log("[checkout-map-search] Nominatim URL:", url);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "IESVRA-Boutique-App/1.0"
      }
    });
    if (!res.ok) throw new Error("Nominatim API error");
    const data = await res.json();
    return data.map((item: any) => item.display_name);
  } catch (e) {
    console.error("Address autocomplete failed:", e);
    return [];
  }
}

/**
 * Geocodes an address string to Latitude/Longitude coordinates and extracts address components.
 * Tries Google Geocoding API if a key is provided, otherwise falls back to OpenStreetMap Nominatim.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || !address.trim()) return null;

  // 1. Check if the address is a resolved Google Maps URL in cache
  const cached = resolvedUrlsCache.get(address);
  if (cached) {
    console.log("[delivery] Geocoding cache hit for:", address);
    return cached;
  }

  const apiKey = getGoogleApiKey();

  // 2. Try Google Geocoding API if API key exists
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results?.[0]) {
          const result = data.results[0];
          const loc = result.geometry.location;
          const components = result.address_components || [];

          let streetNumber = "";
          let route = "";
          let sublocality = "";
          let neighborhood = "";
          let city = "";
          let state = "";
          let pincode = "";

          for (const comp of components) {
            if (comp.types.includes("street_number")) {
              streetNumber = comp.long_name;
            }
            if (comp.types.includes("route")) {
              route = comp.long_name;
            }
            if (comp.types.includes("sublocality") || comp.types.includes("sublocality_level_1")) {
              sublocality = comp.long_name;
            }
            if (comp.types.includes("neighborhood")) {
              neighborhood = comp.long_name;
            }
            if (comp.types.includes("locality")) {
              city = comp.long_name;
            }
            if (comp.types.includes("administrative_area_level_1")) {
              state = comp.long_name;
            }
            if (comp.types.includes("postal_code")) {
              pincode = comp.long_name;
            }
          }

          return {
            lat: loc.lat,
            lon: loc.lng,
            line1: [streetNumber, route].filter(Boolean).join(" "),
            line2: [sublocality, neighborhood].filter(Boolean).join(", "),
            city,
            state,
            pincode,
          };
        }
      }
    } catch (e) {
      console.warn("Google Geocoding failed, falling back to Nominatim:", e);
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1&addressdetails=1&countrycodes=in&accept-language=en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "IESVRA-Boutique-App/1.0"
      }
    });
    if (!res.ok) throw new Error("Nominatim geocoding error");
    const data = await res.json();
    if (data && data.length > 0) {
      const first = data[0];
      const addr = first.address || {};

      const road = addr.road || addr.pedestrian || addr.street || "";
      const houseNumber = addr.house_number || "";
      const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
      const city = addr.city || addr.town || addr.village || addr.county || "";
      const state = addr.state || "";
      const pincode = addr.postcode || "";

      return {
        lat: parseFloat(first.lat),
        lon: parseFloat(first.lon),
        line1: [houseNumber, road].filter(Boolean).join(" "),
        line2: suburb,
        city,
        state,
        pincode,
      };
    }
  } catch (e) {
    console.error("Geocoding failed:", e);
  }

  return null;
}

/**
 * Checks if a given address is within the 15km threshold from the warehouse.
 */
export async function checkExpressEligibility(
  address: string
): Promise<DeliveryEligibility> {
  if (!address || !address.trim()) {
    return { eligible: false, distance: null, error: "Address is empty" };
  }

  try {
    const coords = await geocodeAddress(address);
    if (!coords) {
      return {
        eligible: false,
        distance: null,
        error:
          "We couldn't verify this address for express delivery, standard delivery available",
      };
    }

    const distance = calculateHaversineDistance(
      WAREHOUSE_LAT,
      WAREHOUSE_LON,
      coords.lat,
      coords.lon
    );

    return {
      eligible: distance <= MAX_EXPRESS_DISTANCE_KM,
      distance: distance,
      error: null,
    };
  } catch (e) {
    return {
      eligible: false,
      distance: null,
      error:
        "We couldn't verify this address for express delivery, standard delivery available",
    };
  }
}

/**
 * Reverse geocodes Latitude/Longitude coordinates into structured address components.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
  const apiKey = getGoogleApiKey();

  // 1. Try Google Maps Reverse Geocoding if API key exists
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results?.[0]) {
          const result = data.results[0];
          const components = result.address_components || [];
          
          let streetNumber = "";
          let route = "";
          let sublocality = "";
          let neighborhood = "";
          let city = "";
          let state = "";
          let pincode = "";

          for (const comp of components) {
            if (comp.types.includes("street_number")) streetNumber = comp.long_name;
            if (comp.types.includes("route")) route = comp.long_name;
            if (comp.types.includes("sublocality") || comp.types.includes("sublocality_level_1")) sublocality = comp.long_name;
            if (comp.types.includes("neighborhood")) neighborhood = comp.long_name;
            if (comp.types.includes("locality")) city = comp.long_name;
            if (comp.types.includes("administrative_area_level_1")) state = comp.long_name;
            if (comp.types.includes("postal_code")) pincode = comp.long_name;
          }

          return {
            lat,
            lon,
            line1: [streetNumber, route].filter(Boolean).join(" "),
            line2: [sublocality, neighborhood].filter(Boolean).join(", "),
            city,
            state,
            pincode,
          };
        }
      }
    } catch (e) {
      console.warn("Google reverse geocoding failed, falling back to Nominatim:", e);
    }
  }

  // 2. Fallback to Nominatim Reverse Geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "IESVRA-Boutique-App/1.0"
      }
    });
    if (!res.ok) throw new Error("Nominatim reverse geocoding error");
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      
      const road = addr.road || addr.pedestrian || addr.street || "";
      const houseNumber = addr.house_number || "";
      const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
      const city = addr.city || addr.town || addr.village || addr.county || "";
      const state = addr.state || "";
      const pincode = addr.postcode || "";

      return {
        lat,
        lon,
        line1: [houseNumber, road].filter(Boolean).join(" "),
        line2: suburb,
        city,
        state,
        pincode,
      };
    }
  } catch (e) {
    console.error("Reverse geocoding failed:", e);
  }

  return null;
}
