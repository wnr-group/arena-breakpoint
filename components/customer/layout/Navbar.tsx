'use client'
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-xl md:text-2xl font-black tracking-wider text-white uppercase">
              Break Point <span className="text-yellow-500">Arena</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-yellow-500 font-semibold border-b-2 border-yellow-500 pb-1">Home</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Subscriptions</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Partner Hosting</a>
            
            <div className="flex space-x-4 ml-4">
              <button className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-full font-bold transition-transform hover:scale-105">
                FOOD MENU
              </button>
              <button className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 px-6 py-2 rounded-full font-bold transition-all">
                BOOK SLOT
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-yellow-500 hover:text-yellow-400 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden bg-[#0f0f0f] border-b border-zinc-800 px-4 pt-2 pb-6 space-y-4 shadow-2xl">
          <a href="#" className="block px-3 py-2 text-yellow-500 font-bold">Home</a>
          <a href="#" className="block px-3 py-2 text-gray-300 hover:text-white">Subscriptions</a>
          <a href="#" className="block px-3 py-2 text-gray-300 hover:text-white">Partner Hosting</a>
          <div className="flex flex-col space-y-3 pt-4">
            <button className="w-full bg-yellow-500 text-black px-6 py-3 rounded-full font-bold">
              FOOD MENU
            </button>
            <button className="w-full border border-yellow-500 text-yellow-500 px-6 py-3 rounded-full font-bold">
              BOOK SLOT
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;