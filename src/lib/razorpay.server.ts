export function getRazorpayCredentials() {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").replace(/^\uFEFF/, "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").replace(/^\uFEFF/, "").trim();
  if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured.");
  if (!/^rzp_(live|test)_/.test(keyId)) throw new Error("RAZORPAY_KEY_ID is invalid.");
  return { keyId, keySecret };
}
