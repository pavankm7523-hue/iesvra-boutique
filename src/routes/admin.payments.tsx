import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CreditCard, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsManagement,
});

function PaymentsManagement() {
  const [settings, setSettings] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    enableCod: true,
    enableRazorpay: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("IESVRA_payment_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem("IESVRA_payment_settings", JSON.stringify(settings));
    toast.success("Payment settings saved successfully");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-gold" /> Payment Setting
        </h2>
        <p className="text-navy-deep/60 mt-1">Configure payment gateways, COD, and payout details.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-navy-deep text-lg border-b border-border/50 pb-2">Razorpay Integration</h3>
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Razorpay Key ID</label>
            <input 
              type="text" 
              value={settings.razorpayKeyId} 
              onChange={e => setSettings({...settings, razorpayKeyId: e.target.value})} 
              placeholder="rzp_live_xxxxxxxxxxx"
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-deep mb-2">Razorpay Key Secret</label>
            <input 
              type="password" 
              value={settings.razorpayKeySecret} 
              onChange={e => setSettings({...settings, razorpayKeySecret: e.target.value})} 
              placeholder="••••••••••••••••"
              className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="enableRazorpay"
              checked={settings.enableRazorpay}
              onChange={e => setSettings({...settings, enableRazorpay: e.target.checked})}
              className="w-5 h-5 accent-gold"
            />
            <label htmlFor="enableRazorpay" className="text-sm font-semibold text-navy-deep cursor-pointer">Enable Razorpay (Online Payments)</label>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/50">
          <h3 className="font-bold text-navy-deep text-lg border-b border-border/50 pb-2">Cash on Delivery (COD)</h3>
          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="enableCod"
              checked={settings.enableCod}
              onChange={e => setSettings({...settings, enableCod: e.target.checked})}
              className="w-5 h-5 accent-gold"
            />
            <label htmlFor="enableCod" className="text-sm font-semibold text-navy-deep cursor-pointer">Enable Cash on Delivery</label>
          </div>
        </div>

        <div className="pt-6 border-t border-border/50">
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
