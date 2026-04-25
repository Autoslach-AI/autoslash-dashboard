"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { Search, ShoppingBag, Menu, X, ChevronDown } from 'lucide-react';

export default function Header() {
  const [profile, setProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadHeaderData() {
      const { data } = await supabase
        .from('company_profile')
        .select('company_name, logo_url, navigation_config')
        .eq('id', 1)
        .single();
      
      if (data) setProfile(data);
    }
    loadHeaderData();
  }, [supabase]);

  const mainLinks = [
    { label: 'Product', href: '#', hasDropdown: true },
    { label: 'Company', href: '#', hasDropdown: true },
    { label: 'Pricing', href: '#' }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 py-6 px-6 sm:px-12 flex justify-between items-center bg-[#000000] border-b border-white/5`}
    >
      {/* Brand Logo */}
      <Link href="/" className="z-[110]">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tracking-tighter text-white">
            {profile?.company_name || 'Efferd'}
          </span>
        </div>
      </Link>

      {/* Main Navigation */}
      <nav className="hidden md:flex items-center gap-12">
        {mainLinks.map((link, idx) => (
          <div key={idx} className="flex items-center gap-1.5 cursor-pointer group">
            <span className="text-[14px] font-bold text-white hover:text-white/80 transition-colors">
              {link.label}
            </span>
            {link.hasDropdown && <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />}
          </div>
        ))}
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 z-[110]">
        <Link href="/admin" className="hidden sm:block text-[14px] font-bold text-white hover:text-white/80 transition-colors px-6 py-2">
          Sign In
        </Link>
        <button className="hidden sm:block bg-[#ffffff] text-[#000000] px-6 py-2.5 rounded-lg text-[14px] font-bold hover:bg-white/90 transition-all">
          Get Started
        </button>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center gap-8 z-[100]"
          >
            {mainLinks.map((link, idx) => (
              <span key={idx} className="text-2xl font-black uppercase text-white hover:text-white/60 transition-colors cursor-pointer">
                {link.label}
              </span>
            ))}
            <Link href="/admin" onClick={() => setIsOpen(false)} className="text-2xl font-black uppercase text-white/40">
              Dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
