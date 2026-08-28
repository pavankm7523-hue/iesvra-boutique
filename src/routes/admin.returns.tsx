import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, PackageCheck, RefreshCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { reviewReturnRequest, useReturnRequests, type ReturnRequest } from "@/lib/returnRequests";

export const Route = createFileRoute("/admin/returns")({
  head: () => ({ meta: [{ title: "Returns & Replacements - Admin" }] }),
  component: AdminReturns,
});

function RequestCard({ request, onReviewed }: { request: ReturnRequest; onReviewed: () => Promise<void> }) {
  const review = async (status: "Approved" | "Rejected") => {
    if (request.isSample) {
      toast.info("This is sample preview data. Real customer requests will be actionable here.");
      return;
    }
    const rejectionReason = status === "Rejected"
      ? window.prompt("Enter the reason shown to the customer:")?.trim()
      : undefined;
    if (status === "Rejected" && !rejectionReason) return;
    try {
      const updated = await reviewReturnRequest({ id: request.id, status, rejectionReason });
      toast.success(
        status === "Approved"
          ? `${updated.requestType === "return" ? "Return" : "Replacement"} approved. Manual downstream action is still required.`
          : "Request rejected."
      );
      await onReviewed();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review request.");
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <img src={request.productImage || "/logo.png"} alt="" className="h-16 w-16 rounded-xl object-contain bg-[#f4f2ef] border border-border/40 p-1 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 ${request.requestType === "return" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}>
                {request.requestType}
              </span>
              {request.isSample && <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 bg-amber-50 text-amber-700">Sample pending request</span>}
            </div>
            <h3 className="font-bold text-navy-deep truncate">{request.productName}</h3>
            <p className="text-xs text-navy-deep/55 mt-1">Order #{request.orderId} · {request.customerName}</p>
          </div>
        </div>
        <div className="text-xs text-navy-deep/55 lg:text-right shrink-0">
          <p className="font-semibold text-navy-deep">{new Date(request.requestedAt).toLocaleString()}</p>
          <p>{request.customerEmail}</p>
        </div>
      </div>

      <div className="rounded-xl bg-[#f8f9fb] border border-border/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-navy-deep/45 mb-1">Customer reason</p>
        <p className="text-sm text-navy-deep/80 leading-relaxed">{request.reason}</p>
      </div>

      {request.status === "Pending" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-amber-700 flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> Awaiting admin decision</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => void review("Rejected")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer">
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button type="button" onClick={() => void review("Approved")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold cursor-pointer">
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1 text-xs">
          <p className={request.status === "Approved" ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>{request.status}</p>
          {request.rejectionReason && <p className="text-navy-deep/60">Reason: {request.rejectionReason}</p>}
          {request.downstreamAction && <p className="text-amber-700">{request.downstreamAction}</p>}
        </div>
      )}
    </article>
  );
}

function AdminReturns() {
  const { requests, isLoading, refresh } = useReturnRequests({ includeSample: true });
  const pending = requests.filter((request) => request.status === "Pending");
  const history = requests.filter((request) => request.status !== "Pending");

  return (
    <div className="space-y-8 text-navy-deep">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">Returns & Replacements</h2>
          <p className="text-sm text-navy-deep/60 mt-1">Review customer requests before any refund or replacement action occurs.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 max-w-md">
          Approving updates the request record only. Razorpay refunds and replacement dispatch are not connected yet.
        </div>
      </header>

      <section className="space-y-4" aria-labelledby="pending-requests-heading">
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-gold" />
          <h3 id="pending-requests-heading" className="text-xl font-bold">Pending requests</h3>
          <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1">{pending.length}</span>
        </div>
        {isLoading ? <p className="text-sm text-navy-deep/50">Loading requests…</p> : pending.map((request) => <RequestCard key={request.id} request={request} onReviewed={refresh} />)}
      </section>

      <section className="space-y-4 pt-4 border-t border-border/50" aria-labelledby="request-history-heading">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-gold" />
          <h3 id="request-history-heading" className="text-xl font-bold">Request history</h3>
        </div>
        {history.length === 0
          ? <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-navy-deep/50">Approved and rejected requests will appear here.</div>
          : history.map((request) => <RequestCard key={request.id} request={request} onReviewed={refresh} />)}
      </section>
    </div>
  );
}
