import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Save } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-navy-deep">Store Settings</h2>
        <p className="text-navy-deep/60 mt-1">Configure your store preferences and details.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-secondary/10 flex items-center gap-3">
          <SettingsIcon className="h-5 w-5 text-gold" />
          <h3 className="font-bold text-navy-deep text-lg">General Settings</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-deep">Store Name</label>
              <input type="text" defaultValue="IESVRA" className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-deep">Support Email</label>
              <input type="email" defaultValue="gmailsupport.iesvra@gmail.com" className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-deep">Currency</label>
              <select className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-deep">Tax Rate (%)</label>
              <input type="number" defaultValue="18" className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
            </div>
          </div>
          
          <div className="pt-6 border-t border-border/50 flex justify-end">
             <button className="flex items-center gap-2 bg-gold text-navy-deep px-8 py-3 rounded-md font-bold tracking-wide hover:bg-gold/90 transition-colors shadow-sm">
                <Save className="h-5 w-5" /> Save Configuration
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
