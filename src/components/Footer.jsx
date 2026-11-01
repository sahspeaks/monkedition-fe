import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail } from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-50 text-neutral-800 font-sans">
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-12">
          
          {/* Brand & Description */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img src={assets.logoFull} alt="Monkedition" className="h-28 w-auto" />
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
              Your go-to destination for trendy streetwear that blends comfort, style, and individuality. 
              From anime-inspired designs to urban classics, we craft fashion that tells your story.
            </p>
          </div>
          
          {/* COMPANY Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 tracking-wide">Company</h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/", label: "Home" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact Us" },
                { to: "/careers", label: "Careers" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-neutral-600 hover:text-black transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* MORE INFO Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 tracking-wide">More Info</h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms & Conditions" },
                { to: "/return", label: "Return Policy" },
                { to: "/shipping", label: "Shipping Policy" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-neutral-600 hover:text-black transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold mb-5 tracking-wide">Stay Connected</h3>

            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
              <Mail size={16} className="shrink-0" />
              <a 
                href="mailto:monkedition@gmail.com" 
                className="hover:text-black transition-colors duration-200"
              >
                monkedition@gmail.com
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/moonsflaredotcom"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-neutral-600 hover:text-pink-600 transition-colors duration-200 transform hover:scale-110"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://facebook.com/moonsflaredotcom"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-neutral-600 hover:text-blue-600 transition-colors duration-200 transform hover:scale-110"
              >
                <Facebook size={24} />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-200">
        <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-600 text-sm">
          <p className="text-center sm:text-left">
            © {currentYear} <span className="font-semibold text-neutral-800">Monkedition</span>. All rights reserved.
          </p>
          <span className="text-center sm:text-right">
            Crafted with <span role="img" aria-label="heart" className="text-red-500">❤️</span> for streetwear lovers
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;