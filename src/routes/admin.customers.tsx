import { createFileRoute, Link } from "@tanstack/react-router";
import { useOrdersList } from "@/lib/orders";
import { Users, Mail, Phone, MapPin, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersManagement,
});

function CustomersManagement() {
  const { orders, isLoading } = useOrdersList();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return <div className="p-8 text-center">Loading customers...</div>;
  }

  // Aggregate customers from orders
  const customersMap = new Map<string, {
    email: string;
    name: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
    addresses: Set<string>;
  }>();

  orders.forEach(order => {
    if (!order.customerEmail) return;
    const email = order.customerEmail.toLowerCase();
    
    if (!customersMap.has(email)) {
      customersMap.set(email, {
        email,
        name: order.customerName || "Unknown",
        phone: order.customerPhone || "Unknown",
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: order.date,
        addresses: new Set<string>(),
      });
    }

    const customer = customersMap.get(email)!;
    customer.totalOrders += 1;
    customer.totalSpent += order.total || 0;
    
    if (new Date(order.date) > new Date(customer.lastOrderDate)) {
      customer.lastOrderDate = order.date;
      // Update latest name and phone if they changed
      if (order.customerName) customer.name = order.customerName;
      if (order.customerPhone) customer.phone = order.customerPhone;
    }
    
    if (order.shippingAddress) {
      customer.addresses.add(order.shippingAddress);
    }
  });

  const customersList = Array.from(customersMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by highest spender first

  const filteredCustomers = customersList.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
            <Users className="h-8 w-8 text-gold" /> Customers
          </h2>
          <p className="text-navy-deep/60 mt-1">Manage and view your customer base and their lifetime value.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-navy-deep/40" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-secondary/20 border-b border-border/50">
                <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Customer</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Contact</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70 text-center">Orders</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.email} className="border-b border-border/50 hover:bg-secondary/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-navy-deep">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">Last order: {new Date(customer.lastOrderDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-navy-deep/80">
                      <Mail className="h-4 w-4 text-gold" />
                      <a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-navy-deep/80">
                      <Phone className="h-4 w-4 text-gold" />
                      <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center bg-secondary/30 text-navy-deep/80 text-xs px-2.5 py-1 rounded-full font-bold">
                      {customer.totalOrders}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-emerald-600 text-lg">
                      ₹{customer.totalSpent.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No customers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
