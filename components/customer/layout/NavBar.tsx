import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Gamepad2, Menu, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Subscriptions", path: "/subscriptions" },
  { label: "Retrieve Booking", path: "/retrieve-booking" },
  { label: "FOOD MENU", path: "/food-menu" }
];

// Framer Motion variants
const mobileMenuVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: "easeOut" as const,
      staggerChildren: 0.1 
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2, ease: "easeIn" as const }
  }
};

const linkItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      {/* Main Top Bar */}
      <div className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-gradient-to-b from-black/90 to-transparent">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer group">
          <Gamepad2 className="w-8 h-8 text-[var(--primary)] group-hover:scale-110 transition-transform duration-300" />
          <span className="text-2xl font-bold text-white tracking-wide">Breakpoint Arena</span>
        </Link>

        {/* Desktop Links (Hidden on Mobile) */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.label} 
              href={link.path}
              className="group cursor-pointer relative py-2"
            >
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors duration-300 uppercase tracking-widest">
                {link.label}
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Desktop CTA & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <Link 
            href="/book-slot"
            className="hidden md:inline-block px-6 py-2.5 border-gradient-animated cursor-pointer font-bold text-xs tracking-widest uppercase hover:bg-[var(--primary)] hover:text-black transition-all duration-300 text-center"
          >
            Book Slot
          </Link>
          
          {/* Mobile Hamburger / Close Button */}
          <button 
            className="lg:hidden text-white hover:text-[var(--primary)] transition-colors p-2 z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Full-Screen Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-0 left-0 w-full h-screen bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 gap-8 lg:hidden z-40"
          >
            <div className="flex flex-col items-center gap-6 w-full max-w-sm mt-10">
              {navLinks.map((link) => (
                <motion.div 
                  variants={linkItemVariants}
                  key={link.label} 
                  className="w-full"
                >
                  <Link
                    href={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center cursor-pointer group py-2"
                  >
                    <span className="text-md md:text-xl font-bold text-gray-400 group-hover:text-white group-hover:scale-105 transition-all duration-300 uppercase tracking-widest text-center flex items-center gap-3">
                      {link.label}
                      {/* Arrow that appears on hover/tap */}
                      <ArrowRight className="w-6 h-6 text-[var(--primary)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* Mobile CTA Button */}
            <motion.div variants={linkItemVariants} className="w-full max-w-xs mt-8">
              <Link 
                href="/book-slot"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full py-4 bg-gradient-primary text-black text-center font-extrabold text-sm tracking-widest uppercase rounded hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,193,7,0.3)]"
              >
                Book Slot
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;