"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Menu, X, Battery, Mic, Bluetooth, Volume2, Shield, MapPin, Activity, Moon, Flame, HeartPulse, Wind } from "lucide-react";
import { useConfig } from "@/lib/contexts/config-context";
import AIChat from "@/components/ai-chat";
import HoverFooter from "@/components/footer";
import SmartOnboarding from "@/components/onboarding";

export default function Home() {
  const { config, isReady } = useConfig();
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Rotation & Shuffle Logic for Featured Inventory
  const featuredProducts = useMemo(() => {
    if (!isReady || !config.assets.inventory) return [];
    
    // 1. Separate High Priority from Regular
    const highPriority = config.assets.inventory.filter((p: any) => p.priority >= 8);
    const regular = config.assets.inventory.filter((p: any) => p.priority < 8);

    // 2. Shuffle regular items
    const shuffledRegular = [...regular].sort(() => Math.random() - 0.5);

    // 3. Combine: High Priority first, then shuffled regular
    return [...highPriority, ...shuffledRegular].slice(0, 5); // Limit to 5 for the grid
  }, [isReady, config.assets.inventory]);

  useEffect(() => {
    if (isReady) {
      const images = config.assets.heroImages;
      if (images.length > 0) {
        const randomIdx = Math.floor(Math.random() * images.length);
        setHeroImage(images[randomIdx]);
      }
    }
  }, [isReady, config.assets.heroImages]);

  if (!isReady) return null;

  return (
    <div className="bg-[#000000] text-white min-h-screen selection:bg-white selection:text-black font-sans">
      
      <section className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-black pt-16">
        <AnimatePresence mode="wait">
          {heroImage ? (
            <motion.div 
              key={heroImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 z-0"
            >
              <Image 
                src={heroImage} 
                alt="Brand Cinematic" 
                fill 
                className="object-cover grayscale-[20%] brightness-[1.1] scale-105"
                priority
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white" />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-0 bg-white flex items-center justify-center"
            >
              <div className="text-black/5 font-black text-[20vw] select-none uppercase tracking-tighter">
                {config.identity.name}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl w-full px-8 sm:px-16 z-10 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            {config.identity.logoUrl && (
              <motion.img 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src={config.identity.logoUrl} 
                className="w-12 h-12 object-contain mb-12 opacity-80" 
              />
            )}
            
            <h1 className="text-[14vw] md:text-[10vw] lg:text-[180px] font-black tracking-[-0.06em] leading-[0.8] uppercase mb-8 text-black">
              {config.identity.name}
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              style={{ willChange: "opacity, transform, filter", backfaceVisibility: "hidden" }}
              className="text-sm md:text-xl text-black/40 font-bold tracking-[0.6em] uppercase italic mb-16 max-w-2xl"
            >
              {config.identity.slogan}
            </motion.p>

            <Link href="/shop" className="group relative px-16 py-5 overflow-hidden transition-all bg-black text-white font-black text-[10px] tracking-[0.4em] uppercase rounded-full hover:px-20 ring-4 ring-black/5">
              <span className="relative z-10">ENTER STUDIO</span>
            </Link>
          </motion.div>
        </div>
      </section>

      <AIChat />

      {/* SECTION 2: CURATED OFFERS */}
      <section className="py-24 px-6 sm:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {config.assets.curatedOffers.map((offer: any, i: number) => (
            <OfferCard 
              key={i}
              title={offer.title} 
              desc={offer.desc} 
              img={offer.img}
              accentColor={config.identity.accentColor}
            />
          ))}
        </div>
      </section>

      {/* SECTION 3: CORE ARCHITECTURE */}
      <section className="py-32 px-6 sm:px-12 bg-white border-y border-black/5 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-16">
            <header>
              <span className="micro-label mb-6 block border-black/20 text-black/60">The Architecture</span>
              <h2 className="text-5xl md:text-7xl font-light tracking-tight text-black">Technical<br />Foundations</h2>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              <MainFeatureItem 
                icon={<Battery className="w-5 h-5" style={{ color: config.identity.accentColor }} />}
                title="Sustained Power"
                desc="Extended battery lifecycle for demanding operations."
              />
              <MainFeatureItem 
                icon={<Mic className="w-5 h-5" style={{ color: config.identity.accentColor }} />}
                title="Aural Precision"
                desc="Studio-grade microphone integration for flawless communication."
              />
              <MainFeatureItem 
                icon={<Bluetooth className="w-5 h-5" style={{ color: config.identity.accentColor }} />}
                title="Unified Sync"
                desc="Seamless connectivity across the Enterprise ecosystem."
              />
              <MainFeatureItem 
                icon={<Volume2 className="w-5 h-5" style={{ color: config.identity.accentColor }} />}
                title="Active Isolation"
                desc="Intelligence noise cancellation for deep focus."
              />
              <MainFeatureItem 
                icon={<Shield className="w-5 h-5" style={{ color: config.identity.accentColor }} />}
                title="Guardian Shell"
                desc="IPX4 rated resistance against environmental factors."
              />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="relative h-[600px] lg:h-[800px] w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent z-10 lg:block hidden" />
            <Image 
              src="https://picsum.photos/seed/lumia-tech/1200/1200" 
              alt="Lumia Core Tech" 
              fill 
              className="object-contain grayscale brightness-110"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: STUDIO INVENTORY (With Priority Rotation) */}
      <section className="py-32 px-6 sm:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 pb-8 border-b border-black/5">
            <div className="space-y-4">
              <span className="micro-label border-black/20 text-black/60">Global Inventory</span>
              <h2 className="text-4xl font-light tracking-tight text-black">Curated Intensity</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-12">
            {featuredProducts.map((item: any) => (
              <ProductGridItem 
                key={item.id}
                img={item.img}
                title={item.title}
                price={item.price}
                badge={item.status === 'New' ? 'NEW' : undefined}
                accentColor={config.identity.accentColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <HoverFooter />
    </div>
  );
}

function OfferCard({ title, desc, img, accentColor }: { title: string; desc: string; img: string; accentColor: string }) {
  return (
    <div className="bg-black/5 p-12 flex items-center justify-between group h-[340px] rounded-sm overflow-hidden border border-black/5 hover:border-black/10 transition-all duration-500 backdrop-blur-sm relative">
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent pointer-events-none" />
      <div className="flex flex-col space-y-6 max-w-[60%] relative z-10">
        <h3 className="text-3xl font-black uppercase tracking-tighter text-black">{title}</h3>
        <p className="text-black/40 font-medium leading-relaxed italic">{desc}</p>
        <div 
          className="h-[1px] w-8 bg-black/20 transition-all group-hover:w-16" 
          style={{ backgroundColor: accentColor }}
        />
      </div>
      <div className="relative w-48 h-48 transform group-hover:scale-110 transition-transform duration-700">
        <Image src={img} alt={title} fill className="object-contain grayscale brightness-110 hover:grayscale-0 hover:brightness-100 transition-all duration-700" referrerPolicy="no-referrer" />
      </div>
    </div>
  );
}

function MainFeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-8 group border-l border-black/5 pl-8 hover:border-black transition-colors duration-500">
      <div className="space-y-3">
        <div className="text-black/40 group-hover:text-black transition-colors duration-500">
          {icon}
        </div>
        <h4 className="text-[14px] font-black uppercase tracking-widest text-black/90 group-hover:text-black transition-colors">{title}</h4>
        <p className="text-[12px] text-black/30 font-medium leading-relaxed group-hover:text-black/50 transition-colors">{desc}</p>
      </div>
    </div>
  );
}

function ProductGridItem({ img, title, price, oldPrice, rating, badge, accentColor }: { img: string; title: string; price: string; oldPrice?: string; rating?: number; badge?: string; accentColor: string }) {
  return (
    <div className="group flex flex-col space-y-6">
      <div className="relative aspect-[4/5] bg-[#f9f9f9] border border-black/5 rounded-sm overflow-hidden flex items-center justify-center">
        {badge && (
          <span className="absolute top-6 left-6 bg-black text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest z-10 transition-transform group-hover:scale-110" style={{ backgroundColor: accentColor }}>
            {badge}
          </span>
        )}
        <div className="relative w-[85%] h-[85%] transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105 brightness-110 group-hover:brightness-100">
          <Image src={img} alt={title} fill className="object-contain" referrerPolicy="no-referrer" />
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500" />
      </div>
      
      <div className="space-y-1 text-black text-center">
        <h3 className="text-[13px] font-bold tracking-tight text-black/60 line-clamp-1 group-hover:text-black transition-colors uppercase">{title}</h3>
        <div className="flex items-center justify-center gap-3">
          <span className="text-[15px] font-black tracking-tight" style={{ color: accentColor }}>£{price}</span>
          {oldPrice && <span className="text-[11px] text-black/20 line-through font-medium">£{oldPrice}</span>}
        </div>
      </div>
    </div>
  );
}
