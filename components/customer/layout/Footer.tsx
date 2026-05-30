'use client'
import React from 'react';
import { Twitter, Instagram, Disc as Discord } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] border-t border-zinc-900 pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        <div className="mb-8">
          <span className="text-2xl font-black tracking-wider text-white uppercase">
            Break Point <span className="text-yellow-500">Arena</span>
          </span>
        </div>

        <nav className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-semibold text-gray-400">
          <a href="#" className="hover:text-yellow-500 transition-colors">Contact</a>
          <a href="#" className="hover:text-yellow-500 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-yellow-500 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-yellow-500 transition-colors">Socials</a>
        </nav>

        <p className="text-zinc-600 text-xs mb-8">
          © 2026 BREAK POINT ARENA. ELITE GAMING EXCLUSIVITY.
        </p>

        <div className="flex gap-6 text-zinc-500">
          <a href="#" className="hover:text-yellow-500 transition-colors"><Twitter size={20} /></a>
          <a href="#" className="hover:text-yellow-500 transition-colors"><Instagram size={20} /></a>
          <a href="#" className="hover:text-yellow-500 transition-colors"><Discord size={20} /></a>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;