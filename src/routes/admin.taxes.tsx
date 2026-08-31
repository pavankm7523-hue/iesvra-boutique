import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Receipt, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/taxes")({
  component: TaxManagement,
});

function TaxManagement() {
  const [settings, setSettings] = useState({
    gstinNumber: "",
    defaultGstRate: "18",
    includeGstInPrice: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("IESVRA_tax_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem("IESVRA_tax_settings", JSON.stringify(settings));
    toast.success("GST & Tax settings saved successfully");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <Receipt className="h-8 w-8 text-gold" /> Gst & tax setting
        </h2>
        <p className="text-navy-deep/60 mt-1">Configure GST numbers, tax brackets, and invoicing details.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Store GSTIN Number</label>
            <input 
              type="text" 
              value={settings.gstinNumber} 
              onChange={e => setSettings({...settings, gstinNumber: e.target.value})} 
              placeholder="e.g. 27ABCDE1234F1Z5"
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Default Global GST Rate (%)</label>
            <p className="text-xs text-muted-foreground mb-2">This will be applied to products without a specific GST rate.</p>
            <input 
              type="number" 
              value={settings.defaultGstRate} 
              onChange={e => setSettings({...settings, defaultGstRate: e.target.value})} 
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <input 
              type="checkbox" 
              id="includeGstInPrice"
              checked={settings.includeGstInPrice}
              onChange={e => setSettings({...settings, includeGstInPrice: e.target.checked})}
              className="w-5 h-5 accent-gold"
            />
            <label htmlFor="includeGstInPrice" className="text-sm font-semibold text-navy-deep cursor-pointer">Prices entered in products include GST</label>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" /> Save Tax Settings
          </button>
        </div>
      </div>
    </div>
  );
}
