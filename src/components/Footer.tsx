import { Link } from "@tanstack/react-router";
import logo from "@/assets/ishvara-logo.png";
import { Facebook, Instagram, Youtube, Phone as Whatsapp } from "lucide-react";

export function Footer() {
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
          <div className="flex items-center gap-3 mt-2">
            {[Whatsapp, Instagram, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
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
          <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full h-11 px-4 rounded-md text-white text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button
              type="submit"
              className="w-full bg-gold text-navy-deep h-11 rounded-md font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors duration-300"
            >
              Subscribe
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
