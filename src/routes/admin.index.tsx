import { createFileRoute, Link } from "@tanstack/react-router";
import { useProducts } from "@/lib/products";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { products, deleteProduct } = useProducts();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-navy-deep">Products Dashboard</h2>
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
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                          deleteProduct(product.id);
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
