import { RefreshCcw, RotateCcw } from "lucide-react";
import type { ProductPolicy } from "@/lib/products";

type ProductPolicyFieldsProps = {
  value: ProductPolicy;
  onChange: (value: ProductPolicy) => void;
};

export function ProductPolicyFields({ value, onChange }: ProductPolicyFieldsProps) {
  const update = <K extends keyof ProductPolicy>(key: K, nextValue: ProductPolicy[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <section className="space-y-5 pt-6 border-t border-border/50" aria-labelledby="product-policy-heading">
      <div>
        <h3 id="product-policy-heading" className="text-base font-bold text-navy-deep flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-gold" /> Return & Replacement Policy
        </h3>
        <p className="text-xs text-navy-deep/60 mt-1">
          Set eligibility separately for this product. Turning refunds off still allows replacement when replacement is enabled.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-[#f8f9fb] p-4 space-y-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span className="block text-sm font-bold text-navy-deep">Return & refund available</span>
              <span className="block text-xs text-navy-deep/55 mt-0.5">Customers may return this item for a refund.</span>
            </span>
            <input
              type="checkbox"
              checked={value.isRefundable}
              onChange={(event) => update("isRefundable", event.target.checked)}
              className="mt-1 h-5 w-5 accent-gold cursor-pointer"
              aria-label="Return and refund available"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-deep/60">Return window (days)</span>
            <input
              type="number"
              min="0"
              max="365"
              disabled={!value.isRefundable}
              value={value.returnWindowDays}
              onChange={(event) => update("returnWindowDays", Math.max(0, Number(event.target.value) || 0))}
              className="w-full border border-border/60 rounded-md px-3 py-2 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-gold"
            />
          </label>
        </div>

        <div className="rounded-xl border border-border/60 bg-[#f8f9fb] p-4 space-y-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span className="block text-sm font-bold text-navy-deep">Replacement available</span>
              <span className="block text-xs text-navy-deep/55 mt-0.5">Customers may request a replacement for this item.</span>
            </span>
            <input
              type="checkbox"
              checked={value.isReplaceable}
              onChange={(event) => update("isReplaceable", event.target.checked)}
              className="mt-1 h-5 w-5 accent-gold cursor-pointer"
              aria-label="Replacement available"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-navy-deep/60">Replacement window (days)</span>
            <input
              type="number"
              min="0"
              max="365"
              disabled={!value.isReplaceable}
              value={value.replacementWindowDays}
              onChange={(event) => update("replacementWindowDays", Math.max(0, Number(event.target.value) || 0))}
              className="w-full border border-border/60 rounded-md px-3 py-2 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:border-gold"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">
        <RotateCcw className="h-4 w-4 shrink-0" />
        {!value.isRefundable && value.isReplaceable
          ? "Customer display: replacement-only and non-refundable."
          : !value.isRefundable && !value.isReplaceable
            ? "Customer display: non-refundable and non-replaceable."
            : "The customer product page will use these exact windows."}
      </div>
    </section>
  );
}
