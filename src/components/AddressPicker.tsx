import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Search, MapPin, X, Navigation, Loader2 } from "lucide-react";
import { calculateHaversineDistance, WAREHOUSE_LAT, WAREHOUSE_LON } from "@/lib/delivery";

interface AddressPickerProps {
  onClose: () => void;
}

export function AddressPicker({ onClose }: AddressPickerProps) {
  const OLA_MAPS_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || "";
  
  // Script and SDK state
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  // Map and coordinates state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const olaMapsRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 25.5941, lng: 85.1376 });

  // Autocomplete and Suggestions states
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // delivering-to strip info
  const [deliverAreaMain, setDeliverAreaMain] = useState("Move the map to set location");
  const [deliverAreaSub, setDeliverAreaSub] = useState("Drag the pin to your delivery spot");

  // Form states
  const [addressTag, setAddressTag] = useState<"Home" | "Work" | "Hotel" | "Other">("Home");
  const [flatNo, setFlatNo] = useState("");
  const [floor, setFloor] = useState("");
  const [locality, setLocality] = useState("");
  const [landmark, setLandmark] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [parsedState, setParsedState] = useState("");
  const [pincode, setPincode] = useState("");

  // Submit and loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Dynamic SDK Loading
  useEffect(() => {
    if ((window as any).OlaMaps) {
      setIsSdkLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.unpkg.com/olamaps-web-sdk@latest/dist/olamaps-web-sdk.umd.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).OlaMaps) {
        setIsSdkLoaded(true);
      } else {
        setSdkError("Ola Maps SDK failed to initialize.");
      }
    };
    script.onerror = () => {
      setSdkError("Failed to load Ola Maps script from CDN.");
    };
    document.body.appendChild(script);
  }, []);

  // Pre-fill fields from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("IESVRA_shipping_name") || "";
    const savedPhone = localStorage.getItem("IESVRA_shipping_phone") || "";
    const savedFlat = localStorage.getItem("IESVRA_delivery_address_flat") || "";
    const savedFloor = localStorage.getItem("IESVRA_delivery_address_floor") || "";
    const savedLandmark = localStorage.getItem("IESVRA_delivery_address_landmark") || "";
    const savedTag = localStorage.getItem("IESVRA_delivery_address_tag") as any;

    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
    if (savedFlat) setFlatNo(savedFlat);
    if (savedFloor) setFloor(savedFloor);
    if (savedLandmark) setLandmark(savedLandmark);
    if (savedTag) setAddressTag(savedTag);
  }, []);

  // 2. Initialize Ola Map
  useEffect(() => {
    if (!isSdkLoaded || !mapContainerRef.current || mapRef.current) return;

    if (!OLA_MAPS_API_KEY) {
      setSdkError("VITE_OLA_MAPS_API_KEY is not defined in the environment.");
      return;
    }

    try {
      // Default to saved location if present, otherwise default Patna coordinates
      const savedLatStr = localStorage.getItem("IESVRA_delivery_address_lat");
      const savedLngStr = localStorage.getItem("IESVRA_delivery_address_lng");
      let startCenter = [85.1376, 25.5941]; // [lng, lat]
      
      if (savedLatStr && savedLngStr) {
        const lt = parseFloat(savedLatStr);
        const lg = parseFloat(savedLngStr);
        if (!isNaN(lt) && !isNaN(lg)) {
          startCenter = [lg, lt];
          setCoords({ lat: lt, lng: lg });
        }
      }

      olaMapsRef.current = new (window as any).OlaMaps({ apiKey: OLA_MAPS_API_KEY });
      mapRef.current = olaMapsRef.current.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: mapContainerRef.current,
        center: startCenter,
        zoom: 15
      });

      // Initial reverse geocode
      handleReverseGeocode(startCenter[1], startCenter[0]);

      // Bind moveend event to read center coordinates
      mapRef.current.on("moveend", () => {
        const center = mapRef.current.getCenter();
        setCoords({ lat: center.lat, lng: center.lng });
        handleReverseGeocode(center.lat, center.lng);
      });
    } catch (err) {
      console.error("Failed to initialize Ola Maps:", err);
      setSdkError("Failed to load map instance. Ensure your API key is active.");
    }
  }, [isSdkLoaded]);

  // Hide autocomplete suggestions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // 3. Reverse Geocoding
  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("Reverse geocode request failed");
      const data = await res.json();
      const result = data?.results?.[0];
      if (result) {
        const formatted = result.formatted_address || result.name || "";
        const mainArea = result.name || "Selected Location";
        setLocality(formatted);
        setDeliverAreaMain(mainArea);
        setDeliverAreaSub(formatted);

        // Parse address components
        const components = result.address_components || [];
        let pc = "";
        let st = "";
        let ct = "";
        for (const comp of components) {
          const types = comp.types || [];
          if (types.includes("postal_code")) pc = comp.long_name;
          if (types.includes("administrative_area_level_1")) st = comp.long_name;
          if (types.includes("locality") || types.includes("administrative_area_level_2") || types.includes("city")) ct = comp.long_name;
        }
        setCity(ct);
        setParsedState(st);
        setPincode(pc);
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
  };

  // 4. Autocomplete search query with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data?.predictions || []);
        }
      } catch (err) {
        console.error("Autocomplete failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 5. Suggestion Select and Map FlyTo
  const handleSuggestionClick = async (p: any) => {
    setSearchQuery(p.description);
    setShowSuggestions(false);

    let lat = p.geometry?.location?.lat;
    let lng = p.geometry?.location?.lng || p.geometry?.location?.lon;

    // If suggestion predictions don't contain geometry, geocode description
    if (!lat || !lng) {
      try {
        const res = await fetch(`/api/geocode?address=${encodeURIComponent(p.description)}`);
        if (res.ok) {
          const data = await res.json();
          const first = data?.geocodingResults?.[0] || data?.results?.[0];
          lat = first?.geometry?.location?.lat;
          lng = first?.geometry?.location?.lng || first?.geometry?.location?.lon;
        }
      } catch (err) {
        console.error("Geocoding failed for suggestion:", err);
      }
    }

    if (lat && lng && mapRef.current) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        mapRef.current.flyTo({
          center: [parsedLng, parsedLat],
          zoom: 16
        });
        setCoords({ lat: parsedLat, lng: parsedLng });
        handleReverseGeocode(parsedLat, parsedLng);
      }
    } else {
      toast.error("Could not resolve location coordinates.");
    }
  };

  // 6. Recenter on Current Geolocation GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 16
          });
          setCoords({ lat: latitude, lng: longitude });
          handleReverseGeocode(latitude, longitude);
          toast.success("Location centered!");
        }
      },
      (err) => {
        console.error("GPS detection error:", err);
        toast.error("Failed to retrieve GPS location. Ensure browser permissions are enabled.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 7. Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: Record<string, string> = {};
    if (!flatNo.trim()) errors.flatNo = "Flat / House no is required";
    if (!locality.trim()) errors.locality = "Locality is required (Please drag map to set)";
    if (!name.trim()) errors.name = "Full name is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields.");
      return;
    }
    setFormErrors({});

    setIsSubmitting(true);
    try {
      const addressPayload = {
        flatNo,
        floor,
        locality,
        landmark,
        lat: coords.lat,
        lng: coords.lng,
        addressTag,
        name,
        phone
      };

      const res = await fetch("/api/save-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressPayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save address request failed");
      }

      // Sync address components to localStorage
      localStorage.setItem("IESVRA_delivery_address_flat", flatNo);
      localStorage.setItem("IESVRA_delivery_address_floor", floor);
      localStorage.setItem("IESVRA_delivery_address_locality", locality);
      localStorage.setItem("IESVRA_delivery_address_landmark", landmark);
      localStorage.setItem("IESVRA_delivery_address_lat", String(coords.lat));
      localStorage.setItem("IESVRA_delivery_address_lng", String(coords.lng));
      localStorage.setItem("IESVRA_delivery_address_tag", addressTag);
      localStorage.setItem("IESVRA_shipping_name", name);
      localStorage.setItem("IESVRA_shipping_phone", phone);
      localStorage.setItem("IESVRA_delivery_city", city);
      localStorage.setItem("IESVRA_delivery_state", parsedState);
      localStorage.setItem("IESVRA_delivery_pincode", pincode);

      // Save overall combined addresses
      const line1 = [flatNo, floor].filter(Boolean).join(", ");
      const line2 = [locality, landmark].filter(Boolean).join(", ");
      const full = [flatNo, floor, locality, landmark].filter(Boolean).join(", ");

      localStorage.setItem("IESVRA_delivery_address_line1", line1);
      localStorage.setItem("IESVRA_delivery_address_line2", line2);
      localStorage.setItem("IESVRA_delivery_address", full);

      // Check express delivery eligibility
      const distance = calculateHaversineDistance(WAREHOUSE_LAT, WAREHOUSE_LON, coords.lat, coords.lng);
      const isExpress = distance <= 15;
      localStorage.setItem("IESVRA_is_express_eligible", isExpress ? "true" : "false");

      // Dispatch sync events to Header/Cart
      window.dispatchEvent(new Event("iesvra-address-updated"));
      window.dispatchEvent(new Event("storage"));

      setSubmitSuccess(true);
      toast.success("Delivery address saved successfully!");
      
      // Delay closing modal slightly to show success feedback
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-0 md:p-4 select-none">
      <div 
        className="bg-white w-full md:max-w-5xl h-full md:h-[650px] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        
        {/* LEFT: MAP PANEL */}
        <div className="relative flex-1 bg-slate-100 min-h-[300px] md:min-h-full">
          
          {/* OLA Map Instance Container */}
          <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" id="olamap-instance">
            {sdkError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-50 p-6 text-center text-red-600">
                <span className="text-lg font-bold mb-2">Map Loading Error</span>
                <p className="text-xs max-w-sm mb-4 font-semibold">{sdkError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Reload Page
                </button>
              </div>
            )}
            {!isSdkLoaded && !sdkError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#eef1ee]">
                <Loader2 className="h-10 w-10 text-[#0c831f] animate-spin mb-3" />
                <span className="text-xs font-semibold text-slate-500">Loading live interactive map...</span>
              </div>
            )}
          </div>

          {/* Search bar overlay */}
          <div className="absolute top-4 left-4 right-4 z-20" ref={suggestionsRef}>
            <div className="flex items-center gap-2.5 bg-white rounded-xl shadow-lg border border-slate-100 p-3">
              <Search className="h-5 w-5 text-[#0c831f] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Search area, street name, landmark..."
                className="w-full text-sm outline-none text-slate-800 placeholder:text-slate-400 font-medium bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-14 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-[250px] overflow-y-auto z-30">
                {suggestions.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(p)}
                    className="flex gap-3 items-start px-4 py-3 border-b border-slate-100 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-700 font-medium text-left">{p.description}</span>
                  </div>
                ))}
              </div>
            )}

            {showSuggestions && isSearching && (
              <div className="absolute top-14 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-100 py-3 text-center text-xs text-slate-400 font-medium z-30">
                Searching addresses...
              </div>
            )}
          </div>

          {/* Center-fixed red pin */}
          <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[100%] z-20 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] flex flex-col items-center">
            <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
              <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#e11d2e" />
              <circle cx="17" cy="17" r="7" fill="#fff" />
            </svg>
            <div className="w-1.5 h-1.5 bg-black/40 rounded-full blur-[1px] mt-0.5 animate-pulse" />
          </div>

          {/* Floating Location GPS Recenter Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-24 right-4 z-20 bg-white hover:bg-slate-50 border border-slate-100 w-11 h-11 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            title="Go to current location"
          >
            <Navigation className="h-5 w-5 text-[#0c831f]" />
          </button>

          {/* Bottom delivering-to summary strip */}
          <div className="absolute bottom-4 left-4 right-4 z-20 bg-white rounded-xl shadow-lg border border-slate-100 p-3.5 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#0c831f] rounded-full shrink-0 animate-ping" />
            <div className="flex flex-col items-start leading-snug truncate">
              <span className="text-xs font-bold text-slate-900 truncate w-full text-left">{deliverAreaMain}</span>
              <span className="text-[10px] text-slate-500 font-medium truncate w-full text-left">{deliverAreaSub}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: FORM PANEL */}
        <div className="w-full md:w-[420px] p-6 overflow-y-auto max-h-[50vh] md:max-h-full border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-between">
          
          <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">Enter complete address</h2>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tag Selection Row */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Save Address As</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { tag: "Home", icon: "🏠" },
                  { tag: "Work", icon: "💼" },
                  { tag: "Hotel", icon: "🏨" },
                  { tag: "Other", icon: "📍" }
                ].map(({ tag, icon }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAddressTag(tag as any)}
                    className={`py-2 text-[11px] font-bold rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
                      addressTag === tag
                        ? "border-[#0c831f] bg-[#e8f7ea] text-[#0a6c1a]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Flat/House No Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Flat / House no / Building name *</label>
                <input
                  type="text"
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  placeholder="e.g. Flat 302, Shree Residency"
                  className={`w-full text-xs font-semibold px-3.5 py-3 border rounded-xl outline-none transition-colors placeholder:text-slate-400 bg-slate-50/50 ${
                    formErrors.flatNo ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#0c831f]"
                  }`}
                />
                {formErrors.flatNo && <span className="text-[9px] text-red-500 font-bold">{formErrors.flatNo}</span>}
              </div>

              {/* Floor Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Floor (optional)</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 3rd Floor"
                  className="w-full text-xs font-semibold px-3.5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f] placeholder:text-slate-400 bg-slate-50/50"
                />
              </div>

              {/* Locality Field (ReadOnly/Locked) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Area / Sector / Locality *</label>
                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                    lat: {coords.lat.toFixed(5)}, lng: {coords.lng.toFixed(5)}
                  </span>
                </div>
                <input
                  type="text"
                  value={locality}
                  readOnly
                  placeholder="Drag center pin to auto-fill"
                  className="w-full text-xs font-semibold px-3.5 py-3 border border-slate-200 rounded-xl outline-none bg-slate-100 text-slate-700 cursor-not-allowed"
                />
                {formErrors.locality && <span className="text-[9px] text-red-500 font-bold">{formErrors.locality}</span>}
              </div>

              {/* Landmark Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nearby landmark (optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near City Mall"
                  className="w-full text-xs font-semibold px-3.5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f] placeholder:text-slate-400 bg-slate-50/50"
                />
              </div>

              {/* Recipient Details divider */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold italic text-left">Enter details for seamless delivery experience</p>
              </div>

              {/* Name Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={`w-full text-xs font-semibold px-3.5 py-3 border rounded-xl outline-none transition-colors placeholder:text-slate-400 bg-slate-50/50 ${
                    formErrors.name ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#0c831f]"
                  }`}
                />
                {formErrors.name && <span className="text-[9px] text-red-500 font-bold">{formErrors.name}</span>}
              </div>

              {/* Phone Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Phone Number (optional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full text-xs font-semibold px-3.5 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f] placeholder:text-slate-400 bg-slate-50/50"
                />
              </div>

              {/* Hidden button to bind form submit */}
              <button type="submit" className="hidden" />
            </form>
          </div>

          {/* Submit Button Section */}
          <div className="pt-4 border-t border-slate-100 mt-4 md:mt-0">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitSuccess}
              className={`w-full py-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 select-none active:scale-[0.98] transition-all cursor-pointer ${
                submitSuccess
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-[#0c831f] hover:bg-[#0a6c1a] disabled:bg-slate-400 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Saving address...</span>
                </>
              ) : submitSuccess ? (
                <>
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs text-white">✓</span>
                  <span>Address saved</span>
                </>
              ) : (
                <span>Save and proceed</span>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
