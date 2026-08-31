import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bell, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationManagement,
});

function NotificationManagement() {
  const [settings, setSettings] = useState({
    adminEmail: "ishvaraindiaa@gmail.com",
    notifyOnOrder: true,
    notifyOnLowStock: true,
    customerWelcomeEmail: true,
    customerOrderConfirmation: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("IESVRA_notification_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem("IESVRA_notification_settings", JSON.stringify(settings));
    toast.success("Notification settings saved successfully");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <Bell className="h-8 w-8 text-gold" /> Notification Settings
        </h2>
        <p className="text-navy-deep/60 mt-1">Configure email and SMS alerts for admins and customers.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-navy-deep text-lg border-b border-border/50 pb-2">Admin Notifications</h3>
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Admin Notification Email</label>
            <p className="text-xs text-muted-foreground mb-2">Email address to receive store alerts.</p>
            <input 
              type="email" 
              value={settings.adminEmail} 
              onChange={e => setSettings({...settings, adminEmail: e.target.value})} 
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="notifyOnOrder"
                checked={settings.notifyOnOrder}
                onChange={e => setSettings({...settings, notifyOnOrder: e.target.checked})}
                className="w-5 h-5 accent-gold"
              />
              <label htmlFor="notifyOnOrder" className="text-sm font-semibold text-navy-deep cursor-pointer">Email me when a new order is placed</label>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="notifyOnLowStock"
                checked={settings.notifyOnLowStock}
                onChange={e => setSettings({...settings, notifyOnLowStock: e.target.checked})}
                className="w-5 h-5 accent-gold"
              />
              <label htmlFor="notifyOnLowStock" className="text-sm font-semibold text-navy-deep cursor-pointer">Email me when product stock runs low</label>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/50">
          <h3 className="font-bold text-navy-deep text-lg border-b border-border/50 pb-2">Customer Notifications</h3>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="customerWelcomeEmail"
                checked={settings.customerWelcomeEmail}
                onChange={e => setSettings({...settings, customerWelcomeEmail: e.target.checked})}
                className="w-5 h-5 accent-gold"
              />
              <label htmlFor="customerWelcomeEmail" className="text-sm font-semibold text-navy-deep cursor-pointer">Send welcome email to new signups</label>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="customerOrderConfirmation"
                checked={settings.customerOrderConfirmation}
                onChange={e => setSettings({...settings, customerOrderConfirmation: e.target.checked})}
                className="w-5 h-5 accent-gold"
              />
              <label htmlFor="customerOrderConfirmation" className="text-sm font-semibold text-navy-deep cursor-pointer">Send order confirmation and invoices</label>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" /> Save Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
