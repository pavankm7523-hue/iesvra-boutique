import { createFileRoute, Link } from "@tanstack/react-router";
import { useProducts } from "@/lib/products";
import { useOrdersList } from "@/lib/orders";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { products, deleteProduct } = useProducts();
  const { orders } = useOrdersList();

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Processing').length;
  // Compute low stock items (mock threshold for now or if we add stock field)
  const lowStockProducts = products.filter(p => p.stock !== undefined ? p.stock < 10 : false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-navy-deep">Dashboard Overview</h2>
        <p className="text-navy-deep/60 mt-1">Welcome back, Super Admin. Here is your store's performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex flex-col justify-center">
          <div className="text-sm font-semibold text-navy-deep/60 uppercase tracking-wider mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-navy-deep">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex flex-col justify-center">
          <div className="text-sm font-semibold text-navy-deep/60 uppercase tracking-wider mb-2">Total Orders</div>
          <div className="text-3xl font-bold text-navy-deep">{totalOrders}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex flex-col justify-center">
          <div className="text-sm font-semibold text-navy-deep/60 uppercase tracking-wider mb-2">Pending Orders</div>
          <div className="text-3xl font-bold text-amber-600">{pendingOrders}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border/50 shadow-sm flex flex-col justify-center">
          <div className="text-sm font-semibold text-navy-deep/60 uppercase tracking-wider mb-2">Low Stock Items</div>
          <div className="text-3xl font-bold text-red-600">{lowStockProducts.length}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-12 mb-6">
        <div>
          <h3 className="text-2xl font-display font-bold text-navy-deep">Products Inventory</h3>
          <p className="text-navy-deep/60 mt-1">Manage your store's inventory locally.</p>
        </div>
        <Link
          to="/admin/product/new"
          className="flex items-center gap-2 bg-gold text-navy-deep px-6 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-gold/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/20 border-b border-border/50">
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Image</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Name</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Category</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Price</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/5 transition-colors">
                <td className="p-4">
                  <div className="w-12 h-12 rounded bg-[#f4f2ef] flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-navy-deep">{product.name}</div>
                  <div className="text-xs text-navy-deep/60 truncate max-w-[200px]">{product.sub}</div>
                </td>
                <td className="p-4">
                  <span className="inline-block bg-secondary/30 text-navy-deep/80 text-xs px-2 py-1 rounded font-medium">
                    {product.categories.join(", ") || "Uncategorized"}
                  </span>
                </td>
                <td className="p-4 font-bold text-navy-deep">₹{product.price}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to="/admin/product/$id"
                      params={{ id: product.id }}
                      className="p-2 text-navy-deep/60 hover:text-gold hover:bg-gold/10 rounded-md transition-colors"
                      title="Edit Product"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                          try {
                            const result = await deleteProduct(product.id);
                            if (result.deletedId !== product.id) {
                              throw new Error("The server did not confirm the deleted product ID.");
                            }
                            toast.success(`Product "${product.name}" deleted successfully.`);
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Product could not be deleted.");
                          }
                        }
                      }}
                      className="p-2 text-navy-deep/60 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-navy-deep/60">
                  No products found. Add some to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
