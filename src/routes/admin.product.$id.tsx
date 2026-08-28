import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useProducts, categories, DEFAULT_PRODUCT_POLICY, getProductPolicy } from "@/lib/products";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { MediaUploader } from "@/components/MediaUploader";
import { ProductPolicyFields } from "@/components/ProductPolicyFields";
import type { ProductMedia, ProductPolicy, ProductVariant } from "@/lib/products";

export const Route = createFileRoute("/admin/product/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { products, updateProduct, isLoaded } = useProducts();
  const navigate = useNavigate();
  
  const product = products.find(p => p.id === id);

  const [formData, setFormData] = useState({
    name: "",
    sub: "",
    price: "",
    mrp: "",
    stock: "50",
    categories: [] as string[],
    description: "",
    colors: [] as string[],
    isBestSeller: false,
  });

  const [gallery, setGallery] = useState<ProductMedia[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [policy, setPolicy] = useState<ProductPolicy>(DEFAULT_PRODUCT_POLICY);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sub: product.sub,
        price: product.price.toString(),
        mrp: product.mrp.toString(),
        stock: (product.stock ?? 50).toString(),
        categories: product.categories || [],
        description: product.description,
        colors: product.colors || [],
        isBestSeller: product.isBestSeller || false,
      });
      setGallery(product.gallery || [{ id: "main", type: "image", url: product.image }]);
      setVariants(product.variants || []);
      setPolicy(getProductPolicy(product));
    }
  }, [product]);

  if (!isLoaded) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: "var_" + Date.now(),
        label: "Pack of " + (variants.length + 1) * 5,
        price: Number(formData.price) || 199,
        mrp: Number(formData.mrp) || 499,
        unitPriceText: "",
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gallery.length === 0) {
      toast.error("Please add at least one product image before saving.");
      return;
    }

    const updatedProduct = {
      ...product,
      name: formData.name,
      sub: formData.sub,
      price: Number(formData.price),
      mrp: Number(formData.mrp),
      stock: Math.max(0, parseInt(formData.stock, 10) || 0),
      image: gallery.length > 0 ? gallery[0].url : "https://placehold.co/800x800?text=No+Image",
      gallery: gallery,
      variants: variants.length > 0 ? variants : undefined,
      categories: formData.categories.length > 0 ? formData.categories : ["Uncategorized"],
      colors: formData.colors,
      description: formData.description,
      isBestSeller: formData.isBestSeller,
      ...policy,
    };
    
    updateProduct(updatedProduct);
    toast.success("Product updated successfully!");
    navigate({ to: "/admin" });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep">Edit Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-border/50 p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Form Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-deep">Product Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-deep">Sub-title / Short Desc</label>
              <input type="text" value={formData.sub} onChange={e => setFormData({...formData, sub: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-deep">Selling Price (₹)</label>
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-deep">MRP (₹)</label>
                <input required type="number" min="0" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-deep">Stock Quantity</label>
                <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-navy-deep">Categories</label>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <label key={cat.name} className="flex items-center gap-2 text-sm bg-secondary/20 px-3 py-1.5 rounded-md cursor-pointer hover:bg-secondary/40 transition">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(cat.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, categories: [...formData.categories, cat.name] });
                        } else {
                          setFormData({ ...formData, categories: formData.categories.filter((c) => c !== cat.name) });
                        }
                      }}
                      className="rounded text-gold focus:ring-gold accent-gold"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isBestSeller"
                checked={formData.isBestSeller}
                onChange={e => setFormData({...formData, isBestSeller: e.target.checked})}
                className="rounded text-gold focus:ring-gold accent-gold h-4 w-4 cursor-pointer"
              />
              <label htmlFor="isBestSeller" className="text-sm font-semibold text-navy-deep cursor-pointer select-none">
                Mark as Best Seller
              </label>
            </div>
          </div>

          {/* Right Column: Media Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-navy-deep">Media (Images & Videos)</label>
            <MediaUploader value={gallery} onChange={setGallery} />
          </div>
        </div>

        <ProductPolicyFields value={policy} onChange={setPolicy} />

        {/* Size / Pack Variants Section */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-deep flex items-center gap-2">
                <Layers className="h-4 w-4 text-gold" /> Size & Pack Options (Amazon-Style Variants)
              </h3>
              <p className="text-xs text-navy-deep/60 mt-0.5">
                Add selectable sizes/packs (e.g. 5, 10, 15, 20, 30, 50, or S, M, L) with custom prices and MRPs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1.5 bg-secondary/30 hover:bg-gold hover:text-navy-deep text-navy-deep text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Size Option
            </button>
          </div>

          {variants.length > 0 && (
            <div className="space-y-3 bg-[#f8f9fb] p-4 rounded-xl border border-border/60">
              <div className="grid grid-cols-12 gap-3 text-xs font-bold uppercase tracking-wider text-navy-deep/70 px-1">
                <span className="col-span-3">Size / Pack Label</span>
                <span className="col-span-3">Price (₹)</span>
                <span className="col-span-3">MRP (₹)</span>
                <span className="col-span-2">Unit Note</span>
                <span className="col-span-1 text-right">Remove</span>
              </div>

              {variants.map((variant, idx) => (
                <div key={variant.id || idx} className="grid grid-cols-12 gap-3 items-center bg-white p-2.5 rounded-lg border border-border/40">
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={variant.label}
                      onChange={(e) => handleUpdateVariant(idx, "label", e.target.value)}
                      placeholder="e.g. 20 or Pack of 20"
                      className="w-full h-9 px-3 text-xs font-bold text-navy-deep border border-border/60 rounded-md focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={variant.price}
                      onChange={(e) => handleUpdateVariant(idx, "price", parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="w-full h-9 px-3 text-xs font-bold text-navy-deep border border-border/60 rounded-md focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={variant.mrp || ""}
                      onChange={(e) => handleUpdateVariant(idx, "mrp", parseFloat(e.target.value) || 0)}
                      placeholder="MRP"
                      className="w-full h-9 px-3 text-xs text-navy-deep border border-border/60 rounded-md focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={variant.unitPriceText || ""}
                      onChange={(e) => handleUpdateVariant(idx, "unitPriceText", e.target.value)}
                      placeholder="e.g. (₹9.05 / count)"
                      className="w-full h-9 px-2 text-[11px] text-navy-deep/80 border border-border/60 rounded-md focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      title="Delete option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-navy-deep">Description</label>
          <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold resize-none" />
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <button type="submit" className="flex items-center gap-2 bg-gold text-navy-deep px-8 py-3 rounded-md font-bold tracking-wide hover:bg-gold/90 transition-colors shadow-sm">
            <Save className="h-5 w-5" /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
