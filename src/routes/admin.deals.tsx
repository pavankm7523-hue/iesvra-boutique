import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Coupon, CouponType, couponDiscountLabel, normalizeCoupon, useCoupons } from "@/lib/coupons";

export const Route = createFileRoute("/admin/deals")({ component: AdminDeals });

const emptyCoupon = (): Coupon => normalizeCoupon({
  id: `coupon_${crypto.randomUUID()}`,
  code: "",
  title: "",
  description: "",
  type: "percentage",
  value: 10,
  minimumOrder: 0,
  maximumDiscount: null,
  firstOrderOnly: false,
  active: true,
  badge: "Verified",
});

function AdminDeals() {
  const { coupons, isLoading, replaceCoupons } = useCoupons();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!editing) return;
    const coupon = normalizeCoupon(editing);
    if (!coupon.code || !coupon.title) return toast.error("Coupon code and title are required.");
    if (coupon.type !== "free_shipping" && coupon.value <= 0) return toast.error("Discount value must be greater than zero.");
    if (coupon.type === "percentage" && coupon.value > 100) return toast.error("Percentage cannot exceed 100%.");
    const duplicate = coupons.some((item) => item.code === coupon.code && item.id !== coupon.id);
    if (duplicate) return toast.error("That coupon code already exists.");
    setIsSaving(true);
    try {
      const exists = coupons.some((item) => item.id === coupon.id);
      await replaceCoupons(exists ? coupons.map((item) => item.id === coupon.id ? coupon : item) : [coupon, ...coupons]);
      toast.success(`Coupon ${coupon.code} saved.`);
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coupon could not be saved.");
    } finally { setIsSaving(false); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await replaceCoupons(coupons.filter((coupon) => coupon.id !== deleteTarget.id));
      toast.success(`Coupon ${deleteTarget.code} deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Coupon could not be deleted.");
    } finally { setIsSaving(false); }
  };

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div><h2 className="text-3xl font-bold text-navy-deep">Deals & Coupons</h2><p className="mt-1 text-sm text-navy-deep/60">Create discount codes shown on Deals and accepted in Cart.</p></div>
      <button type="button" onClick={() => setEditing(emptyCoupon())} className="flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy-deep"><Plus className="h-4 w-4"/> Add Coupon</button>
    </div>

    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {isLoading ? <p className="p-8 text-center">Loading coupons...</p> : coupons.length === 0 ? <p className="p-8 text-center text-navy-deep/60">No coupons yet. Add your first coupon.</p> :
        <table className="w-full text-left"><thead className="bg-secondary/20 text-xs uppercase text-navy-deep/60"><tr><th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Conditions</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
        <tbody>{coupons.map((coupon) => <tr key={coupon.id} className="border-t"><td className="p-4"><div className="font-black">{coupon.code}</div><div className="text-xs text-navy-deep/60">{coupon.title}</div></td><td className="p-4 font-semibold">{couponDiscountLabel(coupon)}</td><td className="p-4 text-sm"><div>{coupon.minimumOrder > 0 ? `Minimum ₹${coupon.minimumOrder}` : "No minimum order"}</div>{coupon.firstOrderOnly && <div className="text-amber-600">First order only</div>}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${coupon.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{coupon.active ? "Active" : "Inactive"}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" title="Edit coupon" onClick={() => setEditing({...coupon})} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4"/></button><button type="button" title="Delete coupon" onClick={() => setDeleteTarget(coupon)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table>}
    </div>

    {editing && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center gap-3"><Tag className="text-gold"/><h3 className="text-xl font-bold">{coupons.some(c=>c.id===editing.id)?"Edit":"Add"} Coupon</h3></div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Coupon code<input value={editing.code} onChange={e=>setEditing({...editing,code:e.target.value.toUpperCase()})} className="mt-1 w-full rounded-lg border p-3" placeholder="SAVE20"/></label>
        <label className="text-sm font-semibold">Title<input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} className="mt-1 w-full rounded-lg border p-3" placeholder="Weekend Saver"/></label>
        <label className="text-sm font-semibold">Discount type<select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value as CouponType})} className="mt-1 w-full rounded-lg border p-3"><option value="percentage">Percentage</option><option value="flat">Flat amount</option><option value="free_shipping">Free shipping</option></select></label>
        {editing.type!=="free_shipping" && <label className="text-sm font-semibold">{editing.type==="percentage"?"Percentage (%)":"Flat discount (₹)"}<input type="number" min="0" value={editing.value} onChange={e=>setEditing({...editing,value:Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-3"/></label>}
        <label className="text-sm font-semibold">Minimum order (₹)<input type="number" min="0" value={editing.minimumOrder} onChange={e=>setEditing({...editing,minimumOrder:Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-3"/></label>
        {editing.type==="percentage" && <label className="text-sm font-semibold">Maximum discount (₹, optional)<input type="number" min="0" value={editing.maximumDiscount??""} onChange={e=>setEditing({...editing,maximumDiscount:e.target.value===""?null:Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-3"/></label>}
        <label className="text-sm font-semibold">Badge<input value={editing.badge} onChange={e=>setEditing({...editing,badge:e.target.value})} className="mt-1 w-full rounded-lg border p-3" placeholder="Limited Time"/></label>
        <label className="flex items-center gap-3 pt-6 text-sm font-semibold"><input type="checkbox" checked={editing.firstOrderOnly} onChange={e=>setEditing({...editing,firstOrderOnly:e.target.checked})}/> First order only</label>
        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={editing.active} onChange={e=>setEditing({...editing,active:e.target.checked})}/> Coupon active</label>
        <label className="md:col-span-2 text-sm font-semibold">Description<textarea value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})} className="mt-1 min-h-24 w-full rounded-lg border p-3" placeholder="Explain the offer and conditions."/></label>
      </div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={isSaving} onClick={()=>setEditing(null)} className="rounded-lg border px-5 py-2.5 font-semibold">Cancel</button><button type="button" disabled={isSaving} onClick={save} className="rounded-lg bg-navy-deep px-5 py-2.5 font-semibold text-white">{isSaving?"Saving...":"Save Coupon"}</button></div>
    </div></div>}

    {deleteTarget && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6"><h3 className="text-xl font-bold">Delete coupon?</h3><p className="mt-3 text-sm text-navy-deep/70">Coupon <strong>{deleteTarget.code}</strong> will immediately stop working.</p><div className="mt-6 flex justify-end gap-3"><button disabled={isSaving} onClick={()=>setDeleteTarget(null)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={isSaving} onClick={remove} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">{isSaving?"Deleting...":"Delete Coupon"}</button></div></div></div>}
  </div>;
}
