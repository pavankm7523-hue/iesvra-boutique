import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, ArrowLeft, TrendingUp, Users, ShoppingBag } from "lucide-react";
import { useOrdersList } from "@/lib/orders";
import { useProducts } from "@/lib/products";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsManagement,
});

function ReportsManagement() {
  const { orders } = useOrdersList();
  const { products } = useProducts();

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  
  // Calculate unique customers
  const uniqueEmails = new Set(orders.map(o => o.customerEmail));
  const totalCustomers = uniqueEmails.size;

  // Simple hardcoded date grouping for demo dashboard
  const today = new Date().toISOString().split("T")[0];
  const todaysOrders = orders.filter(o => o.date === today);
  const todaysRevenue = todaysOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-gold" /> Reports & analytics
        </h2>
        <p className="text-navy-deep/60 mt-1">Deep insights into your store's sales performance.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-navy-deep/60 uppercase tracking-wider mb-2">Lifetime Revenue</div>
            <div className="text-3xl font-bold text-navy-deep">₹{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-navy-deep/60 uppercase tracking-wider mb-2">Total Customers</div>
            <div className="text-3xl font-bold text-navy-deep">{totalCustomers}</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-navy-deep/60 uppercase tracking-wider mb-2">Products Sold</div>
            <div className="text-3xl font-bold text-navy-deep">{totalOrders}</div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm">
          <h3 className="font-bold text-navy-deep text-lg mb-6 pb-2 border-b border-border/50">Today's Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
              <span className="text-navy-deep/80 font-medium">Today's Orders</span>
              <span className="font-bold text-navy-deep">{todaysOrders.length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
              <span className="text-navy-deep/80 font-medium">Today's Revenue</span>
              <span className="font-bold text-navy-deep">₹{todaysRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-secondary/10 rounded-lg">
              <span className="text-navy-deep/80 font-medium">Active Products Catalog</span>
              <span className="font-bold text-navy-deep">{products.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex flex-col items-center justify-center text-center">
          <BarChart3 className="h-16 w-16 text-navy-deep/20 mb-4" />
          <h3 className="font-bold text-navy-deep text-lg mb-2">Advanced Visual Reports</h3>
          <p className="text-navy-deep/60 max-w-sm mb-6">Detailed graphs, funnel analysis, and comparative charts will be activated when enough historical data is gathered.</p>
        </div>
      </div>
    </div>
  );
}
