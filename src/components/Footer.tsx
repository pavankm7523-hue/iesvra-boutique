import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/ishvara-logo.png";
import { Facebook, Instagram, Youtube, Phone as Whatsapp } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubscribing(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe.");
      }
      toast.success("Thanks for subscribing!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-navy-deep text-white/80 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        {/* Brand & Social */}
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="IESVRA"
              className="h-12 w-12 object-contain"
            />
            <span className="font-display text-2xl font-bold tracking-[0.1em] text-white leading-none">
              IESVRA
            </span>
          </Link>
          <p className="text-sm text-white/70 leading-relaxed">
            Your one-stop shop for trendy gadgets, home essentials, beauty & more. Quality products at the best prices.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[
              { Icon: Whatsapp, href: "https://wa.me/917061333200", title: "WhatsApp" },
              { Icon: Instagram, href: "https://www.instagram.com/iesvra.in?igsh=MXBjNnozandyY2F4eA==", title: "Instagram" },
              { Icon: Facebook, href: "#", title: "Facebook" },
              { Icon: Youtube, href: "#", title: "YouTube" },
              {
                Icon: (props: any) => (
                  <svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
                    <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z" />
                  </svg>
                ),
                href: "https://www.amazon.in/stores/AREnterprises/page/3C693C50-561C-4D67-93A0-8EBE977E72C6?lp_asin=B0GYNLKW67&ref_=cm_sw_r_apann_ast_store_SS16SF81907PG51N540P&store_ref=bl_ast_dp_brandlogo_sto",
                title: "Amazon"
              },
              {
                Icon: (props: any) => (
                  <svg role="img" viewBox="0 0 24 24" fill="currentColor" {...props}>
                    <path d="M3.833 1.333a.993.993 0 0 0-.333.061V1c0-.551.449-1 1-1h14.667c.551 0 1 .449 1 1v.333H3.833zm17.334 2.334H2.833c-.551 0-1 .449-1 1V23c0 .551.449 1 1 1h7.3l1.098-5.645h-2.24c-.051 0-5.158-.241-5.158-.241l4.639-.327-.078-.366-1.978-.285 1.882-.158-.124-.449-3.075-.467s3.341-.373 3.392-.373h3.232l.247-1.331c.289-1.616.945-2.807 1.973-3.693 1.033-.892 2.344-1.332 3.937-1.332.643 0 1.053.151 1.231.463.118.186.201.516.279.859.074.352.14.671.095.903-.057.345-.461.465-1.197.465h-.253c-1.327 0-2.134.763-2.405 2.31l-.243 1.355h1.54c.574 0 .781.402.622 1.306-.17.941-.539 1.36-1.111 1.36H14.9L13.804 24h7.362c.551 0 1-.449 1-1V4.667a1 1 0 0 0-.999-1zM20.5 2.333A.334.334 0 0 0 20.167 2H3.833a.334.334 0 0 0-.333.333V3h17v-.667z" />
                  </svg>
                ),
                href: "https://www.flipkart.com/iesvra-x34f16-electric-toothbrush/p/itm42b78d1a9069c?pid=ETBHMN3R5EESCVCC&_refId=&_appId=com.android.chrome",
                title: "Flipkart"
              }
            ].map(({ Icon, href, title }, i) => (
              <a
                key={i}
                href={href}
                target={href !== "#" ? "_blank" : undefined}
                rel={href !== "#" ? "noopener noreferrer" : undefined}
                title={title}
                className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-gold hover:text-navy-deep hover:border-gold flex items-center justify-center transition-all duration-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-6 tracking-wide text-sm uppercase">Quick Links</h4>
          <ul className="space-y-3.5 text-sm">
            <li>
              <Link to="/" className="hover:text-gold transition-colors">Home</Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-gold transition-colors">All Categories</Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-gold transition-colors">Best Sellers</Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-gold transition-colors">New Arrivals</Link>
            </li>
            <li>
              <Link to="/" hash="deals" className="hover:text-gold transition-colors">Offers</Link>
            </li>
            <li>
              <Link to="/track-order" className="hover:text-gold transition-colors">Track Order</Link>
            </li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="text-white font-semibold mb-6 tracking-wide text-sm uppercase">Customer Service</h4>
          <ul className="space-y-3.5 text-sm">
            <li>
              <Link to="/contact" className="hover:text-gold transition-colors">Contact Us</Link>
            </li>
            <li>
              <Link to="/shipping" className="hover:text-gold transition-colors">Shipping Policy</Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-gold transition-colors">Return & Refund Policy</Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-gold transition-colors">Terms & Conditions</Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-gold transition-colors">FAQ's</Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-white font-semibold mb-6 tracking-wide text-sm uppercase">Newsletter</h4>
          <p className="text-sm text-white/70 mb-5 leading-relaxed">
            Subscribe to get amazing offers and new product updates.
          </p>
          <form className="flex flex-col gap-3" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubscribing}
              className="w-full h-11 px-4 rounded-md text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="w-full bg-gold text-navy-deep h-11 rounded-md font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors duration-300 disabled:opacity-50"
            >
              {isSubscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© 2026 IESVRA. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {["UPI", "VISA", "MASTER", "RuPay"].map((p) => (
              <span key={p} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded text-[10px] font-bold text-white/70">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
