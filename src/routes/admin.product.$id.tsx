import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useProducts, categories } from "@/lib/products";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";

import { MediaUploader } from "@/components/MediaUploader";
import type { ProductMedia } from "@/lib/products";

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
    categories: [] as string[],
    description: "",
    colors: [] as string[],
    isBestSeller: false,
  });

  const [gallery, setGallery] = useState<ProductMedia[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sub: product.sub,
        price: product.price.toString(),
        mrp: product.mrp.toString(),
        categories: product.categories || [],
        description: product.description,
        colors: product.colors || [],
        isBestSeller: product.isBestSeller || false,
      });
      setGallery(product.gallery || [{ id: "main", type: "image", url: product.image }]);
    }
  }, [product]);

  if (!isLoaded) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProduct = {
      ...product,
      name: formData.name,
      sub: formData.sub,
      price: Number(formData.price),
      mrp: Number(formData.mrp),
      image: gallery.length > 0 ? gallery[0].url : "https://placehold.co/800x800?text=No+Image",
      gallery: gallery,
      categories: formData.categories.length > 0 ? formData.categories : ["Uncategorized"],
      colors: formData.colors,
      description: formData.description,
      isBestSeller: formData.isBestSeller,
    };
    
    updateProduct(updatedProduct);
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-deep">Selling Price (₹)</label>
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-deep">MRP (₹)</label>
                <input required type="number" min="0" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="w-full border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" />
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
