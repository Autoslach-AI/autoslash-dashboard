"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  LayoutGrid, 
  Database, 
  Upload, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Maximize2,
  ChevronRight,
  Image as ImageIcon,
  Zap,
  Tag
} from 'lucide-react';
import { UniversalProductForm } from '@/components/domain/UniversalProductForm';
import { motion, AnimatePresence } from 'framer-motion';
import { getDomainConfig } from '@/lib/domain-registry';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Category {
  id: string;
  name: string;
}

interface MediaFile {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK';
  image: string;
  extended_specs: any;
  tags: string[];
  media: MediaFile[];
}

export default function InventoryManagementPage() {
  const { id } = useParams();
  const [domain, setDomain] = useState<string>('GENERIC');
  const [config, setConfig] = useState<any>(getDomainConfig('GENERIC'));
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sku: '',
    description: '',
    category: '',
    newCategory: '',
    tags: '',
    extended_specs: {},
    media: [] as MediaFile[]
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const storedClient = localStorage.getItem(`client_${id}`);
    let domainStr = 'GENERIC';
    if (storedClient) {
      const data = JSON.parse(storedClient);
      domainStr = data.business_domain || 'GENERIC';
    } else if (id === 'TEST-99') {
      domainStr = 'ELECTRONICS';
    }
    setDomain(domainStr);
    const domainConfig = getDomainConfig(domainStr);
    setConfig(domainConfig);
    
    // Initialize categories from localStorage or config
    const savedCategories = localStorage.getItem(`categories_${id}`);
    if (savedCategories) {
       setCategories(JSON.parse(savedCategories));
    } else {
       const initialCategories = domainConfig.categoryOptions.map((name: string, index: number) => ({
          id: `cat-${index}-${Date.now()}`,
          name: name.toUpperCase()
       }));
       setCategories(initialCategories);
    }

    // Mock initial products
    setProducts([
      { 
        id: 'REF-001', 
        name: `Primary ${domainConfig.itemType} Alpha`, 
        price: 125000, 
        description: 'High-performance core unit with optimized neural pathways.', 
        category: domainConfig.categoryOptions[0], 
        status: 'ACTIVE', 
        image: 'https://picsum.photos/seed/node1/200',
        extended_specs: {},
        tags: ['CORE', 'STABLE'],
        media: []
      },
      { 
        id: 'REF-002', 
        name: `Secondary ${domainConfig.itemType} Beta`, 
        price: 85000, 
        description: 'Reliable secondary node for auxiliary data processing.', 
        category: domainConfig.categoryOptions[1] || domainConfig.categoryOptions[0], 
        status: 'ACTIVE', 
        image: 'https://picsum.photos/seed/node2/200',
        extended_specs: {},
        tags: ['AUX', 'DATA'],
        media: []
      }
    ]);
  }, [id]);

  const updateExtended = (key: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      extended_specs: { ...prev.extended_specs, [key]: val }
    }));
  };

  const addCategory = () => {
    if (formData.newCategory) {
      const exists = categories.some(c => c.name.toLowerCase() === formData.newCategory.toLowerCase());
      if (!exists) {
        const newCat = {
          id: `cat-${Date.now()}`,
          name: formData.newCategory.toUpperCase()
        };
        const updated = [...categories, newCat];
        setCategories(updated);
        localStorage.setItem(`categories_${id}`, JSON.stringify(updated));
        setFormData({ ...formData, category: newCat.name, newCategory: '' });
      }
    }
  };

  const deleteCategory = (catId: string) => {
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    localStorage.setItem(`categories_${id}`, JSON.stringify(updated));
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditingValue(cat.name);
  };

  const saveRename = () => {
    if (editingId && editingValue.trim()) {
      const updated = categories.map(c => 
        c.id === editingId ? { ...c, name: editingValue.toUpperCase() } : c
      );
      setCategories(updated);
      localStorage.setItem(`categories_${id}`, JSON.stringify(updated));
      setEditingId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        let fileType: MediaFile['type'] = 'document';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';

        const newMedia: MediaFile = {
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: event.target?.result as string,
          name: file.name,
          type: fileType,
          size: `${(file.size / 1024).toFixed(1)} KB`
        };

        setFormData(prev => ({
          ...prev,
          media: [...prev.media, newMedia]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (mediaId: string) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter(m => m.id !== mediaId)
    }));
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const newProduct: Product = {
        id: formData.sku || `REF-${Math.floor(Math.random() * 999)}`,
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        status: 'ACTIVE',
        image: formData.media.find(m => m.type === 'image')?.url || 'https://picsum.photos/seed/new/200',
        extended_specs: formData.extended_specs,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        media: formData.media
      };
      setProducts([newProduct, ...products]);
      setFormData({
        name: '',
        price: '',
        sku: '',
        description: '',
        category: '',
        newCategory: '',
        tags: '',
        extended_specs: {},
        media: []
      });
      setIsSyncing(false);
    }, 1500);
  };

  const filteredProducts = filter === 'ALL' ? products : products.filter(p => p.category === filter);

  return (
    <div className="min-h-screen bg-[#000000] font-mono selection:bg-[#39FF14] selection:text-black overflow-y-auto custom-scrollbar scroll-smooth">
       
       <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-12 pb-40 space-y-16">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <Package className="w-5 h-5 text-[#39FF14]" />
                   <h1 className="text-xl font-black uppercase tracking-tighter text-white">ORACLE_INVENTORY_LATTICE</h1>
                </div>
                <p className="text-[9px] text-white/20 uppercase tracking-[0.4em]">Protocol Domain: {domain} // Node_Active</p>
             </div>
             <div className="flex items-center gap-3 px-4 py-2 border border-white/5 bg-white/[0.02] rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Neural_Link: Established</span>
             </div>
          </div>

          {/* SECTION 1: CATEGORY MANAGEMENT */}
          <section className="bg-[#050505] border border-white/5 rounded-3xl p-8 lg:p-12 space-y-10 shadow-2xl relative overflow-hidden group">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-1 h-3 bg-[#39FF14] rounded-full shadow-[0_0_10px_#39FF14]" />
                   <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Section_01 // Gérer les secteurs</h2>
                </div>
                <Database className="w-5 h-5 text-white/5 group-hover:text-[#39FF14]/20 transition-colors" />
             </div>
             
             <div className="space-y-8">
                <div className="flex gap-3 max-w-2xl">
                   <input 
                     value={formData.newCategory}
                     onChange={(e) => setFormData({...formData, newCategory: e.target.value})}
                     onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                     placeholder="Injecter un nouveau secteur..."
                     className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-6 py-4 text-xs text-white focus:outline-none focus:border-[#39FF14]/40 transition-all placeholder:text-white/10 font-mono shadow-inner"
                   />
                   <button 
                     onClick={addCategory}
                     className="w-14 h-14 bg-white/5 hover:bg-[#39FF14] hover:text-black border border-white/10 rounded-xl flex items-center justify-center transition-all text-white hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] group/add"
                   >
                      <Plus className="w-6 h-6 group-hover:scale-125 transition-transform" />
                   </button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                   <AnimatePresence>
                      {categories.map(c => (
                         <motion.div 
                           key={c.id} 
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.9 }}
                           className={`flex items-center gap-4 px-5 py-3 bg-white/[0.02] border rounded-lg group/chip transition-all hover:bg-white/[0.05] ${editingId === c.id ? 'border-[#39FF14] bg-[#39FF14]/5' : 'border-white/5 hover:border-[#39FF14]/30 hover:shadow-[0_0_15px_rgba(57,255,20,0.1)]'}`}
                         >
                            {editingId === c.id ? (
                               <input 
                                 autoFocus
                                 value={editingValue}
                                 onChange={(e) => setEditingValue(e.target.value)}
                                 onBlur={saveRename}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') saveRename();
                                   if (e.key === 'Escape') setEditingId(null);
                                 }}
                                 className="bg-transparent border-none text-[10px] font-black text-[#39FF14] uppercase tracking-widest outline-none w-24"
                               />
                            ) : (
                               <span 
                                 onDoubleClick={() => startEditing(c)}
                                 className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover/chip:text-white transition-colors cursor-text select-none"
                               >
                                  {c.name}
                               </span>
                            )}
                            
                            <button 
                              onClick={() => deleteCategory(c.id)}
                              className="text-white/5 group-hover/chip:text-red-500/60 transition-all hover:scale-110"
                            >
                               <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         </motion.div>
                      ))}
                   </AnimatePresence>
                </div>
             </div>
          </section>

          {/* SECTION 2: PRODUCT INITIALIZATION */}
          <section className="bg-[#050505] border border-white/5 rounded-3xl p-8 space-y-10 shadow-2xl relative">
             <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-[#39FF14] rounded-full shadow-[0_0_10px_#39FF14]" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Section_02 // Ajouter un produit</h2>
             </div>

             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-mono text-white/30">NOM *</Label>
                      <input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#39FF14]/60 transition-all font-mono"
                      />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-mono text-white/30">PRIX (FCFA) *</Label>
                      <input 
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-[#39FF14] focus:outline-none focus:border-[#39FF14]/60 transition-all font-mono"
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <Label className="text-[10px] uppercase tracking-widest font-mono text-white/30">DESCRIPTION</Label>
                   <textarea 
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-xs text-white/60 min-h-[120px] focus:outline-none focus:border-[#39FF14]/40 transition-all font-mono leading-relaxed"
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-mono text-white/30">CATÉGORIE *</Label>
                      <div className="relative">
                         <select 
                           value={formData.category}
                           onChange={(e) => setFormData({...formData, category: e.target.value})}
                           className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white/60 focus:outline-none focus:border-[#39FF14]/60 transition-all font-mono appearance-none uppercase"
                         >
                            <option value="">Sélectionner...</option>
                            {categories.map(c => <option key={c.id} value={c.name} className="bg-black">{c.name}</option>)}
                         </select>
                         <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 rotate-90" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-mono text-white/30">CODE SKU</Label>
                      <input 
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="Auto-généré..."
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white/40 focus:outline-none focus:border-[#39FF14]/60 transition-all font-mono placeholder:text-white/5"
                      />
                   </div>
                </div>
             </div>
          </section>

          {/* SECTION 3: SPECIFICATIONS & MEDIAS */}
          <section className="bg-[#050505] border border-white/5 rounded-3xl p-8 space-y-12 shadow-2xl">
             <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-[#39FF14] rounded-full shadow-[0_0_10px_#39FF14]" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Section_03 // Spécifications & Médias</h2>
             </div>

             <div className="space-y-10">
                {/* DOMAIN SPECIFIC FIELDS (SIZES, etc) */}
                <UniversalProductForm 
                  domain={domain} 
                  extendedSpecs={formData.extended_specs} 
                  onChange={updateExtended} 
                />

                <div className="space-y-3">
                   <Label className="text-[10px] uppercase tracking-widest font-mono text-white/30">TAGS / MOTS-CLÉS</Label>
                   <input 
                     value={formData.tags}
                     onChange={(e) => setFormData({...formData, tags: e.target.value})}
                     placeholder="robe, soirée, élégant..."
                     className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white/60 focus:outline-none focus:border-[#39FF14]/40 font-mono placeholder:text-white/5"
                   />
                </div>

                <div className="space-y-6">
                   <Label className="text-[10px] uppercase tracking-widest font-mono text-white/30">MÉDIAS (PHOTOS, VIDÉOS, DOCUMENTS)</Label>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <label className="aspect-square bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-[#39FF14]/40 hover:bg-[#39FF14]/5 transition-all cursor-pointer">
                         <input 
                           type="file" 
                           multiple 
                           accept="image/*,video/*,.pdf,.doc,.docx" 
                           className="hidden" 
                           onChange={handleFileUpload}
                         />
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-white/20 group-hover:text-[#39FF14]" />
                         </div>
                         <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Injecter</span>
                      </label>
                      
                      <AnimatePresence>
                        {formData.media.map(m => (
                          <motion.div 
                            key={m.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="aspect-square bg-black border border-white/5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group shadow-xl"
                          >
                             {m.type === 'image' ? (
                               <img src={m.url} alt={m.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                             ) : m.type === 'video' ? (
                               <div className="w-full h-full bg-[#39FF14]/5 flex flex-col items-center justify-center gap-2">
                                  <Zap className="w-6 h-6 text-[#39FF14]" />
                                  <span className="text-[8px] font-black text-[#39FF14] uppercase tracking-widest px-2 text-center truncate w-full">{m.name}</span>
                               </div>
                             ) : (
                               <div className="w-full h-full bg-white/[0.02] flex flex-col items-center justify-center gap-2">
                                  <Database className="w-6 h-6 text-white/20" />
                                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest px-2 text-center truncate w-full">{m.name}</span>
                               </div>
                             )}

                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                                <button 
                                  onClick={() => removeMedia(m.id)}
                                  className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all active:scale-95"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>

                             <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 border border-white/10">
                                <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">{m.type}</span>
                             </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                   </div>
                </div>

                {/* SYNC ACTION */}
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`w-full py-5 rounded-2xl bg-[#39FF14] text-black text-[11px] font-black uppercase tracking-[0.4em] transition-all relative overflow-hidden shadow-[0_0_30px_rgba(57,255,20,0.3)] hover:shadow-[0_0_50px_rgba(57,255,20,0.5)] ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                >
                   <span className="relative z-10">{isSyncing ? 'SYNCHRONISATION...' : 'AJOUTER LE PRODUIT'}</span>
                   {isSyncing && (
                     <motion.div 
                       initial={{ x: '-100%' }}
                       animate={{ x: '100%' }}
                       transition={{ repeat: Infinity, duration: 1.5 }}
                       className="absolute inset-0 bg-white/20"
                     />
                   )}
                </button>
             </div>
          </section>

          {/* SECTION 4: INVENTORY DATABASE */}
          <section className="bg-[#050505] border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-3xl">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                   <div className="w-1 h-3 bg-[#39FF14] rounded-full shadow-[0_0_10px_#39FF14]" />
                   <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Section_04 // Gérer le stock ({products.length})</h2>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within:text-[#39FF14] transition-colors" />
                      <input 
                        type="text" 
                        placeholder="SCAN_RESERVE..." 
                        className="bg-black border border-white/5 rounded-xl py-2.5 pl-10 pr-4 font-mono text-[10px] text-white w-48 focus:outline-none focus:border-[#39FF14]/40 transition-all placeholder:text-white/5"
                      />
                   </div>
                </div>
             </div>

             <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01]">
                         <th className="p-5 text-[9px] font-black uppercase tracking-widest text-white/20">PREVIEW</th>
                         <th className="p-5 text-[9px] font-black uppercase tracking-widest text-white/20">ITEM_IDENTITY</th>
                         <th className="p-5 text-[9px] font-black uppercase tracking-widest text-white/20">VAL_UNIT</th>
                         <th className="p-5 text-[9px] font-black uppercase tracking-widest text-white/20">PROTOCOL</th>
                         <th className="p-5 text-[9px] font-black uppercase tracking-widest text-white/20 text-center">STATUS</th>
                         <th className="p-5 text-[9px] font-black uppercase tracking-widest text-white/20 text-right">ACTION</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.02]">
                      <AnimatePresence>
                         {filteredProducts.map((p) => (
                           <motion.tr 
                             key={p.id}
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="group hover:bg-white/[0.01] transition-all"
                           >
                              <td className="p-5">
                                 <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                 </div>
                              </td>
                              <td className="p-5">
                                 <div className="space-y-0.5">
                                    <p className="text-[11px] font-black text-white hover:text-[#39FF14] cursor-pointer transition-colors uppercase tracking-tight">{p.name}</p>
                                    <p className="text-[8px] font-mono text-white/10 uppercase">NODE::{p.id}</p>
                                 </div>
                              </td>
                              <td className="p-5">
                                 <span className="text-[11px] font-black text-[#39FF14] tabular-nums">{p.price.toLocaleString()} FCFA</span>
                              </td>
                              <td className="p-5">
                                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{p.category}</span>
                              </td>
                              <td className="p-5">
                                 <div className="flex justify-center">
                                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-full border ${p.status === 'ACTIVE' ? 'bg-[#39FF14]/10 border-[#39FF14]/20 text-[#39FF14]' : 'bg-red-500/10 border-red-500/20 text-red-500'} uppercase tracking-widest`}>
                                       {p.status}
                                    </span>
                                 </div>
                              </td>
                              <td className="p-5 text-right">
                                 <div className="flex justify-end gap-2">
                                    <button className="p-2 rounded-lg border border-white/5 text-white/10 hover:text-red-500 hover:border-red-500/20 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                 </div>
                              </td>
                           </motion.tr>
                         ))}
                      </AnimatePresence>
                   </tbody>
                </table>
             </div>
          </section>

          {/* FOOTER STATS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-30 group-hover:opacity-100 transition-opacity pt-10">
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                   <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />
                   <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Node_Stable</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Protocol latency: 0.04ms</span>
             </div>
             <div className="text-[8px] font-mono text-white/10 uppercase tracking-[1em]">SYSTEM_INITIALIZED_2026</div>
          </div>
       </div>

       {/* FLOATING SAVE (ORACLE STYLE) */}
       <button 
         onClick={handleSync}
         className="fixed bottom-10 right-10 w-16 h-16 bg-[#39FF14] text-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(57,255,20,0.6)] hover:scale-110 active:scale-95 transition-all z-[500] group"
       >
          <Save className="w-7 h-7" />
          <div className="absolute -top-12 right-0 bg-black border border-[#39FF14]/40 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
             <span className="text-[9px] font-black text-[#39FF14] uppercase tracking-widest italic">commit_changes</span>
          </div>
       </button>
    </div>
  );
}
