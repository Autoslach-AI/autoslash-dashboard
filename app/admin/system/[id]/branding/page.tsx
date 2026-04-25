"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Upload, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Save,
  Zap,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Database,
  Eye
} from 'lucide-react';

export default function BrandingAssetsPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [phones, setPhones] = useState(['+221 77 123 45 67']);
  const [heroAssets, setHeroAssets] = useState<{id: string, url: string}[]>([]);
  
  const [formData, setFormData] = useState({
    heroTitle: 'IDENTITY_NODE_ALPHA',
    heroSubtitle: 'Next-Gen Neural Infrastructure',
    companyName: 'THE ORACLE CORP',
    slogan: 'Architecting the Digital Unconscious',
    currency: 'USD',
    email: 'admin@oracle.node',
    address: 'CYBER-SECTOR 9, CLOUD-GRID',
    siteDescription: 'Global leader in neural enterprise management and monolithic design systems.',
    topBarMessages: '["FREE_SYNC_FOR_NEW_NODES", "V3.2_STABILITY_MANDATE_ACTIVE"]',
    primaryColor: '142 70% 50%',
    secondaryColor: '210 40% 98%'
  });

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const addPhone = () => {
    if (phones.length < 3) setPhones([...phones, '']);
  };

  const updatePhone = (index: number, val: string) => {
    const newPhones = [...phones];
    newPhones[index] = val;
    setPhones(newPhones);
  };

  const SectionHeader = ({ icon: Icon, title, status = "ACTIVE" }: { icon: any, title: string, status?: string }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/10">
          <Icon className="w-3.5 h-3.5 text-[#39FF14]" />
        </div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] font-mono text-white/90">{title}</h2>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#39FF14]/5 border border-[#39FF14]/10">
        <div className="w-1 h-1 bg-[#39FF14] rounded-full animate-pulse" />
        <span className="text-[7px] font-black text-[#39FF14] uppercase tracking-widest">{status}</span>
      </div>
    </div>
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[9px] font-black uppercase tracking-[0.2em] font-mono text-white/30 px-1 block mb-2">{children}</label>
  );

  const Input = ({ value, onChange, placeholder, type = "text", previewColor }: any) => (
    <div className="relative group">
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-white/80 focus:outline-none focus:border-[#39FF14]/30 transition-all font-mono placeholder:text-white/5"
      />
      {previewColor && (
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
          style={{ backgroundColor: `hsl(${previewColor})` }}
        />
      )}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20 pb-80 space-y-24">
      
      <div className="grid grid-cols-1 gap-24 items-start pb-20">
        
        {/* SECTION 01: HERO_NODE_MANAGER */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#050505] border border-white/5 rounded-[2.5rem] p-12 lg:p-16 shadow-3xl relative overflow-hidden group"
        >
          <SectionHeader icon={Zap} title="Section_01 // Hero_Node_Manager" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
             <div className="space-y-10">
                <div className="space-y-2">
                   <Label>Primary_Title</Label>
                   <Input 
                     value={formData.heroTitle} 
                     onChange={(v: string) => setFormData({...formData, heroTitle: v})}
                     placeholder="NODE_IDENTITY_ALPHA"
                   />
                </div>
                <div className="space-y-2">
                   <Label>Sub_Title_Core</Label>
                   <textarea 
                     value={formData.heroSubtitle}
                     onChange={(e) => setFormData({...formData, heroSubtitle: e.target.value})}
                     className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-xs text-white/80 focus:outline-none focus:border-[#39FF14]/30 transition-all font-mono h-32 resize-none leading-relaxed"
                     placeholder="Identity metadata description..."
                   />
                </div>
             </div>

             <div className="space-y-6">
                <Label>Hero_Asset_Lattice</Label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                   <label className="aspect-video bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 group/upload hover:border-[#39FF14]/40 hover:bg-[#39FF14]/5 transition-all cursor-pointer">
                      <input type="file" className="hidden" />
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-white/10 group-hover/upload:text-[#39FF14]" />
                      </div>
                      <span className="text-[9px] font-black text-white/10 uppercase tracking-widest group-hover/upload:text-white/40">Inject_Asset</span>
                   </label>
                   {/* Asset Previews */}
                   {[1, 2].map(i => (
                     <div key={i} className="aspect-video bg-black border border-white/5 rounded-2xl flex items-center justify-center relative group/asset overflow-hidden shadow-inner">
                        <Database className="w-6 h-6 text-white/5" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/asset:opacity-100 transition-opacity flex items-center justify-center">
                           <button className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </motion.section>

        {/* SECTION 02: CORPORATE_LATTICE */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#050505] border border-white/5 rounded-[2.5rem] p-12 lg:p-16 shadow-3xl space-y-12"
        >
          <SectionHeader icon={Briefcase} title="Section_02 // Corporate_Lattice" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
            <div className="space-y-2">
              <Label>Company_Name</Label>
              <Input value={formData.companyName} onChange={(v: string) => setFormData({...formData, companyName: v})} placeholder="ORACLE_NODE" />
            </div>
            <div className="space-y-2">
              <Label>Slogan_Matrix</Label>
              <Input value={formData.slogan} onChange={(v: string) => setFormData({...formData, slogan: v})} placeholder="NEURAL_LOGIC" />
            </div>
            <div className="space-y-2">
              <Label>Currency_Protocol</Label>
              <Input value={formData.currency} onChange={(v: string) => setFormData({...formData, currency: v})} placeholder="USD" />
            </div>
            <div className="space-y-2">
              <Label>Corporate_Email</Label>
              <Input value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} placeholder="IDENTITY@NODE" />
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2 px-1">
                <Label>Communication_Lines (Max 3)</Label>
                {phones.length < 3 && (
                   <button onClick={addPhone} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#39FF14]/10 hover:text-[#39FF14] transition-all border border-white/5">
                      <Plus className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Add_Line</span>
                   </button>
                )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {phones.map((phone, idx) => (
                   <div key={idx} className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#39FF14] transition-colors" />
                      <input 
                        value={phone}
                        onChange={(e) => updatePhone(idx, e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-white/80 focus:outline-none focus:border-[#39FF14]/30 transition-all shadow-inner"
                        placeholder="+00-NULL"
                      />
                   </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
             <div className="space-y-4">
                <Label>Logo_Matrix_Slot</Label>
                <div className="h-40 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center gap-4 group/logo cursor-pointer hover:border-[#39FF14]/20 transition-all shadow-inner">
                   <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover/logo:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-white/20 group-hover/logo:text-[#39FF14]" />
                   </div>
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-hover/logo:text-white transition-colors">Change_Logo</span>
                </div>
             </div>
             <div className="space-y-4">
                <Label>Favicon_Grid_Slot</Label>
                <div className="h-40 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center gap-4 group/fav cursor-pointer hover:border-[#39FF14]/20 transition-all shadow-inner">
                   <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover/fav:scale-110 transition-transform">
                      <Globe className="w-5 h-5 text-white/20 group-hover/fav:text-[#39FF14]" />
                   </div>
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-hover/fav:text-white transition-colors">Change_Favicon</span>
                </div>
             </div>
          </div>
        </motion.section>

        {/* SECTION 03: NEURAL_PALETTE & META */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#050505] border border-white/5 rounded-[2.5rem] p-12 lg:p-16 shadow-3xl space-y-12"
        >
          <SectionHeader icon={Palette} title="Section_03 // Neural_Palette & Meta" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
             <div className="space-y-2">
                <Label>Primary_HSL_Protocol</Label>
                <Input 
                  value={formData.primaryColor} 
                  onChange={(v: string) => setFormData({...formData, primaryColor: v})} 
                  placeholder="142 70% 50%" 
                  previewColor={formData.primaryColor}
                />
             </div>
             <div className="space-y-2">
                <Label>Secondary_HSL_Protocol</Label>
                <Input 
                  value={formData.secondaryColor} 
                  onChange={(v: string) => setFormData({...formData, secondaryColor: v})} 
                  placeholder="210 40% 98%" 
                  previewColor={formData.secondaryColor}
                />
             </div>
          </div>

          <div className="space-y-4 relative">
             <div className="flex items-center justify-between mb-2">
                <Label>SEO_Meta_Description_Kernel</Label>
                <button 
                  className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#39FF14]/5 border border-[#39FF14]/10 text-[9px] font-black text-[#39FF14] hover:bg-[#39FF14]/10 transition-all group"
                  title="Neural Auto-Gen"
                >
                   <Sparkles className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                   <span className="tracking-[0.2em]">NEURAL_AUTO_GEN</span>
                </button>
             </div>
             <textarea 
               value={formData.siteDescription}
               onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
               className="w-full bg-black border border-white/5 rounded-[2.5rem] px-8 py-8 text-sm text-white/80 focus:outline-none focus:border-[#39FF14]/30 transition-all font-mono h-48 resize-none leading-relaxed shadow-inner"
               placeholder="System definition protocol..."
             />
          </div>

          <div className="space-y-2">
             <Label>Top_Bar_Messages_Array (JSON)</Label>
             <Input 
               value={formData.topBarMessages} 
               onChange={(v: string) => setFormData({...formData, topBarMessages: v})} 
               placeholder='["MSG_01"]'
             />
          </div>
        </motion.section>

      </div>

      {/* FIXED SAVE ACTION */}
      <motion.button 
        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(57, 255, 20, 0.3)' }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSync}
        disabled={isSyncing}
        className="fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-8 py-5 rounded-2xl bg-[#39FF14] text-black font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all disabled:opacity-50 disabled:grayscale group"
      >
        <Save className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
        <span className="text-[11px] font-mono">{isSyncing ? 'SYNCING_NODES...' : 'Save_Profile_Core'}</span>
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
      </motion.button>

    </div>
  );
}
