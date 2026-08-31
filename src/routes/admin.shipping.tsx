import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/shipping")({
  component: ShippingSettings,
});

function ShippingSettings() {
  const [settings, setSettings] = useState({
    freeShippingThreshold: "499",
    baseShipping: "59",
    codCharge: "40",
  });

  useEffect(() => {
    const saved = localStorage.getItem("IESVRA_shipping_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("IESVRA_shipping_settings", JSON.stringify(settings));
    toast.success("Shipping settings saved successfully");
    // Trigger event to update cart instantly
    window.dispatchEvent(new Event("IESVRA_settings_changed"));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <Truck className="h-8 w-8 text-gold" />
          Shipping Settings
        </h2>
        <p className="text-navy-deep/60 mt-1">Configure your delivery charges and thresholds.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Free Shipping Threshold (₹)</label>
            <p className="text-xs text-muted-foreground mb-2">Orders above this amount will get free shipping.</p>
            <input 
              type="number" 
              value={settings.freeShippingThreshold} 
              onChange={e => setSettings({...settings, freeShippingThreshold: e.target.value})} 
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Base Shipping Charge (₹)</label>
            <p className="text-xs text-muted-foreground mb-2">Standard delivery fee for orders below the threshold.</p>
            <input 
              type="number" 
              value={settings.baseShipping} 
              onChange={e => setSettings({...settings, baseShipping: e.target.value})} 
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Cash on Delivery (COD) Charge (₹)</label>
            <p className="text-xs text-muted-foreground mb-2">Extra fee charged when customer selects COD.</p>
            <input 
              type="number" 
              value={settings.codCharge} 
              onChange={e => setSettings({...settings, codCharge: e.target.value})} 
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
