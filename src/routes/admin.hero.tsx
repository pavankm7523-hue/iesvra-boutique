import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHeroBanners, useAddHeroBanner, useUpdateHeroBanner, useDeleteHeroBanner } from "@/lib/hero";
import type { HeroSettings } from "@/lib/api/hero.server";
import { toast } from "sonner";
import { Save, Image as ImageIcon, CheckCircle, Clock, Plus, Trash2, Edit, X, Search } from "lucide-react";
import { useProducts } from "@/lib/products";

export const Route = createFileRoute("/admin/hero")({
  component: AdminHero,
});

function AdminHero() {
  const { data: banners, isLoading } = useHeroBanners();
  const { mutate: addBanner, isPending: isAdding } = useAddHeroBanner();
  const { mutate: updateBanner, isPending: isUpdating } = useUpdateHeroBanner();
  const { mutate: deleteBanner, isPending: isDeleting } = useDeleteHeroBanner();
  const { products } = useProducts();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [isSpecialSale, setIsSpecialSale] = useState(false);
  const [saleEndDate, setSaleEndDate] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});
  const [exclusiveProductIds, setExclusiveProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [imageData, setImageData] = useState<string | undefined>();
  const [imageExt, setImageExt] = useState<string | undefined>();
  const [previewImage, setPreviewImage] = useState<string>("");

  const openForm = (banner?: HeroSettings) => {
    if (banner) {
      setEditingId(banner.id);
      setTitle(banner.title);
      setSubtitle(banner.subtitle);
      setButtonText(banner.buttonText);
      setButtonLink(banner.buttonLink);
      setBackgroundImageUrl(banner.backgroundImageUrl);
      setIsSpecialSale(banner.isSpecialSale);
      setSaleEndDate(banner.saleEndDate || "");
      setProductIds(banner.productIds || []);
      setProductPrices(banner.productPrices || {});
      setExclusiveProductIds(banner.exclusiveProductIds || []);
      setPreviewImage(banner.backgroundImageUrl);
    } else {
      setEditingId(null);
      setTitle("");
      setSubtitle("");
      setButtonText("SHOP NOW");
      setButtonLink("/shop");
      setBackgroundImageUrl("");
      setIsSpecialSale(false);
      setSaleEndDate("");
      setProductIds([]);
      setProductPrices({});
      setExclusiveProductIds([]);
      setPreviewImage("");
    }
    setImageData(undefined);
    setImageExt(undefined);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf("."));
    setImageExt(ext);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageData(result);
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const payload = {
      settings: {
        title,
        subtitle,
        buttonText,
        backgroundImageUrl,
        isSpecialSale,
        saleEndDate: isSpecialSale && saleEndDate ? new Date(saleEndDate).toISOString() : undefined,
        productIds,
        productPrices,
        exclusiveProductIds,
        buttonLink: productIds.length > 0 && buttonLink === "/shop" ? "" : buttonLink, // Will be handled on save or overridden
      },
      imageData,
      imageExt,
    };

    if (editingId) {
      updateBanner(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast.success("Hero Banner updated successfully!");
            setIsFormOpen(false);
          },
          onError: () => toast.error("Failed to update Hero Banner.")
        }
      );
    } else {
      if (!previewImage) {
        toast.error("Please select a background image.");
        return;
      }
      addBanner(
        payload,
        {
          onSuccess: () => {
            toast.success("Hero Banner added successfully!");
            setIsFormOpen(false);
          },
          onError: () => toast.error("Failed to add Hero Banner.")
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      deleteBanner({ id }, {
        onSuccess: () => toast.success("Banner deleted"),
        onError: () => toast.error("Failed to delete banner")
      });
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading banners...</div>;
  }

  const isPending = isAdding || isUpdating;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-deep">Hero Banners</h1>
          <p className="text-navy-deep/60 mt-2">
            Manage multiple banners for your homepage carousel.
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-navy-deep text-white px-5 h-10 rounded-lg font-bold hover:bg-gold hover:text-navy-deep transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Banner
        </button>
      </div>

      {/* Banner List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners?.map((banner, idx) => (
          <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-border/40 overflow-hidden flex flex-col group">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary/20">
              <img src={banner.backgroundImageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">{banner.title}</h3>
                  <p className="text-white/80 text-xs mt-1 line-clamp-1">{banner.subtitle}</p>
                </div>
              </div>
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-md text-navy-deep">
                Slide {idx + 1}
              </div>
              {banner.isSpecialSale && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Sale
                </div>
              )}
            </div>
            <div className="p-3 bg-[#f8f9fb] flex items-center justify-end gap-2 border-t border-border/40">
              <button onClick={() => openForm(banner)} className="p-2 text-navy-deep hover:bg-gold hover:text-white rounded-lg transition-colors" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
              <button disabled={isDeleting} onClick={() => handleDelete(banner.id)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors disabled:opacity-50" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {(!banners || banners.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-white text-navy-deep/50">
            No banners added yet. Click "Add New Banner" to get started.
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-border/40 p-5 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-navy-deep">{editingId ? "Edit Banner" : "Add New Banner"}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-navy-deep/50 hover:text-navy-deep p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between bg-[#f8f9fb] p-4 rounded-lg border border-border/60">
                <div>
                  <h3 className="font-bold text-navy-deep flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gold" />
                    Special Sale Mode
                  </h3>
                  <p className="text-sm text-navy-deep/60">Enable this to show countdown timers on this specific slide.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isSpecialSale} onChange={(e) => setIsSpecialSale(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-navy-deep mb-1">Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 px-4 bg-[#f8f9fb] border border-border/60 rounded-lg focus:outline-none focus:border-gold/50" placeholder="e.g. DUSSEHRA MEGA SALE" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-navy-deep mb-1">Subtitle</label>
                    <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full h-11 px-4 bg-[#f8f9fb] border border-border/60 rounded-lg focus:outline-none focus:border-gold/50" placeholder="e.g. Up to 80% off on all items" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-navy-deep mb-1">Button Text</label>
                      <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full h-11 px-4 bg-[#f8f9fb] border border-border/60 rounded-lg focus:outline-none focus:border-gold/50" placeholder="e.g. SHOP NOW" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-navy-deep mb-1">Button Link</label>
                      <input type="text" value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} className="w-full h-11 px-4 bg-[#f8f9fb] border border-border/60 rounded-lg focus:outline-none focus:border-gold/50" placeholder="e.g. /shop" />
                    </div>
                  </div>
                  {isSpecialSale && (
                    <div className="pt-2 border-t border-border/40">
                      <label className="block text-sm font-semibold text-navy-deep mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Sale End Date
                      </label>
                      <input type="datetime-local" value={saleEndDate ? new Date(saleEndDate).toISOString().slice(0, 16) : ""} onChange={(e) => setSaleEndDate(e.target.value)} className="w-full h-11 px-4 bg-[#f8f9fb] border border-border/60 rounded-lg focus:outline-none focus:border-gold/50" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-navy-deep mb-1">Background Image</label>
                  <div className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center hover:bg-[#f8f9fb] transition-colors relative overflow-hidden group h-[250px] flex flex-col justify-center">
                    {previewImage ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-navy-deep/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white mb-2" />
                          <span className="text-white font-semibold">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-navy-deep/50">
                        <ImageIcon className="w-10 h-10 mb-3" />
                        <span className="font-semibold">Click to Upload Image</span>
                        <span className="text-xs mt-1 text-navy-deep/40">Recommended: 1920x1080 (16:9)</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="pt-6 border-t border-border/40">
                <h3 className="text-lg font-bold text-navy-deep mb-2">Sale Products</h3>
                <p className="text-sm text-navy-deep/60 mb-4">Select products to include in this banner's custom shop page collection.</p>
                
                <div className="bg-[#f8f9fb] border border-border/60 rounded-xl overflow-hidden flex flex-col h-[300px]">
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
                            {productIds.includes(p.id) ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-navy-deep/50">₹</span>
                                <input
                                  type="number"
                                  value={productPrices[p.id] !== undefined ? productPrices[p.id] : p.price}
                                  onChange={(e) => setProductPrices({ ...productPrices, [p.id]: Number(e.target.value) })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-20 h-7 px-2 text-sm font-bold text-navy-deep border border-border/60 rounded focus:outline-none focus:border-gold/50"
                                />
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-navy-deep shrink-0">₹{p.price}</p>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-navy-deep/60 truncate">{(p.categories || []).join(", ")}</p>
                            {productIds.includes(p.id) && (
                              <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={exclusiveProductIds.includes(p.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setExclusiveProductIds([...exclusiveProductIds, p.id]);
                                    else setExclusiveProductIds(exclusiveProductIds.filter(id => id !== p.id));
                                  }}
                                  className="rounded text-navy-deep focus:ring-navy-deep accent-navy-deep w-3 h-3"
                                />
                                <span className="text-[10px] uppercase font-bold tracking-wider text-navy-deep">Exclusive</span>
                              </label>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <div className="text-center text-sm text-navy-deep/50 py-8">No products found matching "{productSearch}"</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
            
            <div className="sticky bottom-0 bg-[#f8f9fb] p-5 border-t border-border/40 flex justify-end gap-3 rounded-b-2xl z-10">
              <button onClick={() => setIsFormOpen(false)} className="px-6 h-11 rounded-lg font-bold text-navy-deep/60 hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 bg-navy-deep text-white px-8 h-11 rounded-lg font-bold hover:bg-gold hover:text-navy-deep transition-colors disabled:opacity-50">
                {isPending ? "Saving..." : <><Save className="w-4 h-4" /> Save Banner</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
