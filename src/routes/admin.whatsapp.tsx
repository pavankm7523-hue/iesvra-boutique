import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MessageCircle, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/whatsapp")({
  component: WhatsAppManagement,
});

function WhatsAppManagement() {
  const [settings, setSettings] = useState({
    phoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    enableOrderMessages: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("IESVRA_whatsapp_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem("IESVRA_whatsapp_settings", JSON.stringify(settings));
    toast.success("WhatsApp API settings saved successfully");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-gold" /> WhatsApp settings
        </h2>
        <p className="text-navy-deep/60 mt-1">Configure WhatsApp Cloud API to send transactional messages.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Phone Number ID</label>
            <input 
              type="text" 
              value={settings.phoneNumberId} 
              onChange={e => setSettings({...settings, phoneNumberId: e.target.value})} 
              placeholder="e.g. 1045xxxxxxxxx"
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">WhatsApp Business Account ID</label>
            <input 
              type="text" 
              value={settings.businessAccountId} 
              onChange={e => setSettings({...settings, businessAccountId: e.target.value})} 
              placeholder="e.g. 1122xxxxxxxxx"
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Permanent Access Token</label>
            <input 
              type="password" 
              value={settings.accessToken} 
              onChange={e => setSettings({...settings, accessToken: e.target.value})} 
              placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <input 
              type="checkbox" 
              id="enableOrderMessages"
              checked={settings.enableOrderMessages}
              onChange={e => setSettings({...settings, enableOrderMessages: e.target.checked})}
              className="w-5 h-5 accent-gold"
            />
            <label htmlFor="enableOrderMessages" className="text-sm font-semibold text-navy-deep cursor-pointer">Send automated order status updates on WhatsApp</label>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-green-700 transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" /> Save WhatsApp Config
          </button>
        </div>
      </div>
    </div>
  );
}
