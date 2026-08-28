import { useCallback, useEffect, useState } from "react";

export type ReturnRequestType = "return" | "replacement";
export type ReturnRequestStatus = "Pending" | "Approved" | "Rejected";

export type ReturnRequest = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  requestType: ReturnRequestType;
  requestedAt: string;
  status: ReturnRequestStatus;
  reviewedAt?: string;
  rejectionReason?: string;
  downstreamAction?: string;
  isSample?: boolean;
};

export const SAMPLE_RETURN_REQUEST: ReturnRequest = {
  id: "sample-return-request",
  orderId: "ISH-482731",
  productId: "sample-product",
  productName: "Rechargeable Scalp & Body Massager",
  productImage: "/logo.png",
  customerName: "Aarav Sharma",
  customerEmail: "aarav@example.com",
  reason: "The massager powers on, but the rotating head stops after a few seconds.",
  requestType: "replacement",
  requestedAt: new Date().toISOString(),
  status: "Pending",
  isSample: true,
};

const RETURN_REQUESTS_EVENT = "IESVRA_return_requests_changed";

function emitReturnRequestsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(RETURN_REQUESTS_EVENT));
}

export async function fetchReturnRequests(customerEmail?: string): Promise<ReturnRequest[]> {
  const query = customerEmail ? `?email=${encodeURIComponent(customerEmail)}` : "";
  const response = await fetch(`/api/return-requests${query}`);
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error(data.error || "Failed to load return requests.");
  return Array.isArray(data) ? data : [];
}

export async function createReturnRequest(input: {
  orderId: string;
  productId: string;
  customerEmail: string;
  reason: string;
  requestType: ReturnRequestType;
}): Promise<ReturnRequest> {
  const response = await fetch("/api/return-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Failed to create return request.");
  emitReturnRequestsChanged();
  return data as ReturnRequest;
}

export async function reviewReturnRequest(input: {
  id: string;
  status: Extract<ReturnRequestStatus, "Approved" | "Rejected">;
  rejectionReason?: string;
}): Promise<ReturnRequest> {
  const response = await fetch("/api/return-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "review", ...input }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Failed to review return request.");
  emitReturnRequestsChanged();
  return data as ReturnRequest;
}

export function useReturnRequests(options: { customerEmail?: string; includeSample?: boolean } = {}) {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchReturnRequests(options.customerEmail);
      setRequests(list.length === 0 && options.includeSample ? [SAMPLE_RETURN_REQUEST] : list);
    } catch (error) {
      console.error("[return requests] load failed", error);
      setRequests(options.includeSample ? [SAMPLE_RETURN_REQUEST] : []);
    } finally {
      setIsLoading(false);
    }
  }, [options.customerEmail, options.includeSample]);

  useEffect(() => {
    void refresh();
    window.addEventListener(RETURN_REQUESTS_EVENT, refresh);
    return () => window.removeEventListener(RETURN_REQUESTS_EVENT, refresh);
  }, [refresh]);

  return { requests, isLoading, refresh };
}
