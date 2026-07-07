import { createFileRoute } from "@tanstack/react-router";
import { useCategories, useProducts, Category } from "@/lib/products";
import { useState, useRef } from "react";
import { Layers, Plus, Pencil, Trash2, Save, Upload, X, Image as ImageIcon, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [{ title: "Manage Categories - Admin" }],
  }),
  component: AdminCategories,
});

function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { products, bulkUpdateProducts } = useProducts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setName("");
    setImage("");
    setProductIds([]);
    setProductSearch("");
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setName(cat.name);
    setImage(cat.image);
    setProductIds(products.filter(p => (p.categories || []).includes(cat.name)).map(p => p.id));
    setProductSearch("");
    setEditingCategoryName(cat.name);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed.");
        return;
      }
      if (file.size > 1024 * 1024 * 1.5) {
        toast.error("File is too large. Max size is 1.5MB to save storage space.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    if (!image) {
      toast.error("Please upload or choose an image for the category.");
      return;
    }

    const categoryData: Category = {
      name: name.trim(),
      image: image
    };

    if (modalMode === "add") {
      // Check for duplicate name
      const exists = categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
      if (exists) {
        toast.error("A category with this name already exists.");
        return;
      }
      addCategory(categoryData);
      toast.success(`Category "${name}" created successfully!`);
    } else {
      updateCategory(editingCategoryName, categoryData);
      toast.success(`Category "${name}" updated successfully!`);
    }

    // Bulk update products
    const catName = name.trim();
    const updatedProducts = products.map(p => {
      const isChecked = productIds.includes(p.id);
      const hasCat = (p.categories || []).includes(catName);
      
      if (isChecked && !hasCat) {
        return { ...p, categories: [...(p.categories || []), catName] };
      } else if (!isChecked && hasCat) {
        return { ...p, categories: (p.categories || []).filter(c => c !== catName) };
      }
      return null;
    }).filter(Boolean) as typeof products;

    if (updatedProducts.length > 0) {
      bulkUpdateProducts(updatedProducts);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (catName: string) => {
    const associatedProductsCount = products.filter(
      p => (p.categories || []).includes(catName)
    ).length;

    let confirmMsg = `Are you sure you want to delete the category "${catName}"?`;
    if (associatedProductsCount > 0) {
      confirmMsg = `Warning: There are ${associatedProductsCount} products belonging to "${catName}". If you delete this category, these products will become uncategorized. Do you still want to delete it?`;
    }

    if (confirm(confirmMsg)) {
      deleteCategory(catName);
      toast.success(`Category "${catName}" deleted successfully.`);
    }
  };

  return (
    <div className="space-y-8 font-sans text-navy-deep">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-navy-deep">Categories Inventory</h2>
          <p className="text-navy-deep/60 mt-1 text-sm">Manage shop categories and their visual card images.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gold text-navy-deep px-6 py-3 rounded-md font-bold text-sm tracking-wide hover:bg-gold/90 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border/40 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/20 border-b border-border/45 text-navy-deep/70 text-xs font-bold uppercase tracking-wider">
              <th className="p-5">Icon / Image</th>
              <th className="p-5">Category Name</th>
              <th className="p-5">Product Count</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-sm">
            {categories.map((cat) => {
              const productCount = products.filter(
                p => (p.categories || []).includes(cat.name)
              ).length;
              return (
                <tr key={cat.name} className="hover:bg-secondary/5 transition-colors">
                  <td className="p-5">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-[#f4f2ef] border border-border/50 flex items-center justify-center p-2.5">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                    </div>
                  </td>
                  <td className="p-5 font-bold text-base text-navy-deep">
                    {cat.name}
                  </td>
                  <td className="p-5">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-secondary/30 text-navy-deep/80 border border-border/10">
                      {productCount} {productCount === 1 ? "Product" : "Products"}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 text-navy-deep/60 hover:text-gold hover:bg-gold/10 rounded-md transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.name)}
                        className="p-2 text-navy-deep/60 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-border/40 p-6 md:p-8 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-6">
              <h3 className="text-xl font-bold text-navy-deep uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-5 w-5 text-gold" /> {modalMode === "add" ? "Create Category" : "Edit Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-navy-deep/40 hover:text-navy-deep transition cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/75">
                  Category Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wellness Essentials"
                  className="h-11 px-4 rounded-xl border border-border focus:border-gold focus:ring-1 focus:ring-gold outline-none text-sm transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/75">
                  Category Image Card
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/60 hover:border-gold/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-secondary/5 hover:bg-gold/5 transition-all text-center"
                >
                  {image ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-white border border-border/50 flex items-center justify-center p-3">
                        <img src={image} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xs text-navy-deep/50 font-medium">Click box to replace image</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-navy-deep/40 mb-2" />
                      <p className="text-xs font-bold text-navy-deep">Upload Category Card Image</p>
                      <p className="text-[10px] text-navy-deep/50 mt-1">PNG, JPG, WEBP (Max 1.5MB)</p>
                    </>
                  )}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Product Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-navy-deep/75">
                  Category Products
                </label>
                <div className="bg-[#f8f9fb] border border-border/60 rounded-xl overflow-hidden flex flex-col h-[280px]">
                  <div className="p-3 border-b border-border/60 bg-white relative">
                    <Search className="w-4 h-4 text-navy-deep/40 absolute left-6 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 text-sm bg-secondary/10 border border-transparent rounded-lg focus:outline-none focus:border-gold/50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="overflow-y-auto p-2 flex-1">
                    {products
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map(p => (
                      <label key={p.id} className="flex items-center gap-4 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border/40 mb-1">
                        <input 
                          type="checkbox" 
                          checked={productIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setProductIds([...productIds, p.id]);
                            else setProductIds(productIds.filter(id => id !== p.id));
                          }}
                          className="rounded text-gold focus:ring-gold accent-gold w-4 h-4 ml-2"
                        />
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded bg-secondary" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold text-navy-deep truncate">{p.name}</p>
                            <p className="text-sm font-bold text-navy-deep shrink-0">₹{p.price}</p>
                          </div>
                          <p className="text-xs text-navy-deep/60 truncate">{(p.categories || []).join(", ")}</p>
                        </div>
                      </label>
                    ))}
                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <div className="text-center text-sm text-navy-deep/50 py-8">No products found matching "{productSearch}"</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-navy-deep text-gold font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gold hover:text-navy-deep transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-navy-deep/10 cursor-pointer mt-4"
              >
                <Save className="h-4.5 w-4.5" /> {modalMode === "add" ? "Save Category" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
