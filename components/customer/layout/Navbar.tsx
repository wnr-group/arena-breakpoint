'use client'
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Add a slight shadow/border when the user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Subscriptions', path: '/subscription' },
    { name: 'Partner Hosting', path: '#' }, // Update with actual path later
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#050505]/85 backdrop-blur-md border-b border-zinc-800/50 shadow-lg' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="text-xl md:text-2xl font-black tracking-wider text-white uppercase group">
              Break Point <span className="text-yellow-500 group-hover:text-yellow-400 transition-colors">Arena</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name}
                  href={link.path} 
                  className={`text-sm font-bold tracking-wide uppercase transition-all ${
                    isActive 
                      ? 'text-yellow-500 border-b-2 border-yellow-500 pb-1' 
                      : 'text-gray-300 hover:text-white pb-1 border-b-2 border-transparent hover:border-zinc-700'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button 
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest rounded-full px-6 h-10 transition-transform hover:scale-105"
            >
              Food Menu
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 font-black uppercase tracking-widest rounded-full px-6 h-10 transition-colors bg-transparent"
            >
              Book Slot
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-yellow-500 hover:text-yellow-400 focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden bg-[#0a0a0a] border-b border-zinc-800 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-4 shadow-2xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`block px-3 py-3 rounded-xl text-base font-bold uppercase tracking-wider transition-colors ${
                  isActive 
                    ? 'bg-yellow-500/10 text-yellow-500' 
                    : 'text-gray-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          
          <div className="flex flex-col space-y-3 pt-4 border-t border-zinc-800/50">
            <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest rounded-full h-12">
              Food Menu
            </Button>
            <Button variant="outline" className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 font-black uppercase tracking-widest rounded-full h-12 bg-transparent">
              Book Slot
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;