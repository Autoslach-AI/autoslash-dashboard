'use client';
 
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import {
  Search, Plus, Package, Pencil, Trash2, Eye, EyeOff,
  ChevronDown, X, Upload, Check, Filter, MoreVertical,
  Tag, DollarSign, Layers, AlertCircle, Grid3X3,
  List, ArrowUpDown, Image as ImageIcon, Zap
} from 'lucide-react';
 
// ─── TYPES ────────────────────────────────────────────────────────────────────
 
interface AttributeField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'date';
  options?: string[];
  required: boolean;
  unit?: string;
}
 
interface Category {
  id: string;
  enterprise_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  attribute_schema: AttributeField[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
}
 
interface InventoryItem {
  id: string;
  enterprise_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  unit: string;
  image_url: string | null;
  images: string[];
  is_active: boolean;
  stock_status: string;
  attributes: Record<string, any>;
  tags: string[];
  sort_order: number;
  created_at: string;
}
 
// ─── STOCK STATUS CONFIG ──────────────────────────────────────────────────────
 
const STOCK_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE:     { label: 'Disponible',  color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  OUT_OF_STOCK:  { label: 'Rupture',     color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  DISCONTINUED:  { label: 'Arrêté',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};
 
const PRESET_COLORS = [
  '#4ade80','#60a5fa','#f472b6','#fb923c',
  '#a78bfa','#34d399','#fbbf24','#f87171',
];
 
// ─── ATTRIBUTE RENDERER ───────────────────────────────────────────────────────
 
function AttributeInput({ field, value, onChange }: {
  field: AttributeField;
  value: any;
  onChange: (val: any) => void;
}) {
  const base = "w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-[12px] outline-none focus:border-[#4ade80]/50 transition-all font-mono placeholder:text-white/20";
 
  if (field.type === 'text') return (
    <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className={base} placeholder={field.label} />
  );
  if (field.type === 'number') return (
    <div className="flex items-center gap-2">
      <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} className={base} placeholder="0" />
      {field.unit && <span className="text-[10px] text-white/30 whitespace-nowrap">{field.unit}</span>}
    </div>
  );
  if (field.type === 'boolean') return (
    <div className="flex gap-2">
      {[true, false].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${value === v ? (v ? 'bg-[#4ade80]/20 border border-[#4ade80]/40 text-[#4ade80]' : 'bg-red-500/20 border border-red-500/40 text-red-400') : 'bg-white/5 border border-white/10 text-white/30 hover:text-white/50'}`}>
          {v ? 'Oui' : 'Non'}
        </button>
      ))}
    </div>
  );
  if (field.type === 'select') return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-[12px] outline-none focus:border-[#4ade80]/50 transition-all">
      <option value="">Sélectionner...</option>
      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (field.type === 'multiselect') return (
    <div className="flex flex-wrap gap-1.5">
      {field.options?.map(opt => {
        const sel = (value || []).includes(opt);
        return (
          <button key={opt} type="button" onClick={() => onChange(sel ? (value||[]).filter((v:string)=>v!==opt) : [...(value||[]), opt])}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border ${sel ? 'bg-[#4ade80]/15 border-[#4ade80]/40 text-[#4ade80]' : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'}`}>
            {opt}
          </button>
        );
      })}
    </div>
  );
  if (field.type === 'date') return (
    <input type="date" value={value || ''} onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-[12px] outline-none focus:border-[#4ade80]/50 transition-all cursor-pointer" />
  );
  return null;
}
 
// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
 
export default function InventoryPage() {
  const params = useParams();
  const id = params?.id as string;
 
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [planDef, setPlanDef] = useState<any>(null);
  const [loading, setLoading] = useState(true);
 
  // UI state
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [contextItemId, setContextItemId] = useState<string | null>(null);
 
  // Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
 
  // Forms
  const [catForm, setCatForm] = useState<any>({ name: '', description: '', color: '#4ade80', attribute_schema: [] });
  const [itemForm, setItemForm] = useState<any>({ name: '', description: '', price: 0, currency: 'FCFA', unit: 'unité', image_url: '', is_active: true, stock_status: 'AVAILABLE', attributes: {}, tags: [] });
  const [attrSchema, setAttrSchema] = useState<AttributeField[]>([]);
  const [tagInput, setTagInput] = useState('');
 
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  // ── LOAD ────────────────────────────────────────────────────────────────────
 
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: ent } = await supabase.from('enterprises').select('package_type').eq('enterprise_id', id).single();
      if (ent?.package_type) {
        const { data: plan } = await supabase.from('plan_definitions').select('*').eq('plan_name', ent.package_type).single();
        setPlanDef(plan);
      }
      const { data: cats } = await supabase.from('inventory_categories').select('*').eq('enterprise_id', id).order('sort_order');
      const { data: its } = await supabase.from('inventory_items').select('*').eq('enterprise_id', id).order('sort_order');
      setCategories(cats || []);
      setItems(its || []);
      setLoading(false);
    };
    load();
  }, [id]);
 
  // ── LIMITS ──────────────────────────────────────────────────────────────────
 
  const maxCats = planDef?.max_inventory_categories === -1 ? Infinity : (planDef?.max_inventory_categories ?? 5);
  const maxItems = planDef?.max_inventory_items === -1 ? Infinity : (planDef?.max_inventory_items ?? 20);
  const catLimitReached = categories.length >= maxCats;
  const itemLimitReached = items.length >= maxItems;
 
  // ── FILTERED ITEMS ──────────────────────────────────────────────────────────
 
  const filteredItems = items
    .filter(item => activeTab === 'ALL' || item.category_id === activeTab)
    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aVal = (a as any)[sortField] ?? '';
      const bVal = (b as any)[sortField] ?? '';
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
 
  // ── CATEGORY CRUD ────────────────────────────────────────────────────────────
 
  const openAddCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '', color: '#4ade80', attribute_schema: [] });
    setAttrSchema([]);
    setShowCatModal(true);
  };
 
  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', color: cat.color, attribute_schema: cat.attribute_schema });
    setAttrSchema(cat.attribute_schema || []);
    setShowCatModal(true);
  };
 
  const saveCat = async () => {
    if (!catForm.name?.trim()) { alert('Nom obligatoire'); return; }
    const supabase = createClient();
    const payload = { enterprise_id: id, name: catForm.name.trim(), description: catForm.description || null, color: catForm.color, attribute_schema: attrSchema, is_active: true, sort_order: categories.length };
    if (editingCat) {
      const { error } = await supabase.from('inventory_categories').update(payload).eq('id', editingCat.id);
      if (error) { alert('Erreur: ' + error.message); return; }
      setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, ...payload } : c));
    } else {
      const { data, error } = await supabase.from('inventory_categories').insert(payload).select().single();
      if (error) { alert('Erreur: ' + error.message); return; }
      setCategories(prev => [...prev, data]);
    }
    setShowCatModal(false);
  };
 
  const deleteCat = async (cat: Category) => {
    const hasItems = items.some(i => i.category_id === cat.id);
    if (hasItems) { alert('Supprimez d\'abord tous les items de cette catégorie.'); return; }
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    const supabase = createClient();
    await supabase.from('inventory_categories').delete().eq('id', cat.id);
    setCategories(prev => prev.filter(c => c.id !== cat.id));
  };
 
  // ── ITEM CRUD ────────────────────────────────────────────────────────────────
 
  const openAddItem = (cat?: Category) => {
    const targetCat = cat || categories.find(c => c.id === activeTab) || categories[0];
    setEditingItem(null);
    setSelectedCategory(targetCat || null);
    setItemForm({ name: '', description: '', price: 0, currency: 'FCFA', unit: 'unité', image_url: '', is_active: true, stock_status: 'AVAILABLE', attributes: {}, tags: [] });
    setShowItemModal(true);
  };
 
  const openEditItem = (item: InventoryItem) => {
    const cat = categories.find(c => c.id === item.category_id) || null;
    setEditingItem(item);
    setSelectedCategory(cat);
    setItemForm({ ...item, tags: item.tags || [] });
    setShowItemModal(true);
  };
 
  const saveItem = async () => {
    if (!itemForm.name?.trim()) { alert('Nom obligatoire'); return; }
    const supabase = createClient();
    const payload = {
      enterprise_id: id,
      category_id: selectedCategory?.id || null,
      name: itemForm.name.trim(),
      description: itemForm.description || null,
      price: Number(itemForm.price) || 0,
      currency: itemForm.currency || 'FCFA',
      unit: itemForm.unit || 'unité',
      image_url: itemForm.image_url || null,
      is_active: itemForm.is_active,
      stock_status: itemForm.stock_status,
      attributes: itemForm.attributes || {},
      tags: itemForm.tags || [],
    };
    if (editingItem) {
      const { error } = await supabase.from('inventory_items').update(payload).eq('id', editingItem.id);
      if (error) { alert('Erreur: ' + error.message); return; }
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
    } else {
      const { data, error } = await supabase.from('inventory_items').insert(payload).select().single();
      if (error) { alert('Erreur: ' + error.message); return; }
      setItems(prev => [...prev, data]);
    }
    setShowItemModal(false);
    setEditingItem(null);
  };
 
  const deleteItem = async (itemId: string) => {
    if (!confirm('Supprimer cet item ?')) return;
    const supabase = createClient();
    await supabase.from('inventory_items').delete().eq('id', itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    setContextItemId(null);
  };
 
  const toggleItem = async (item: InventoryItem) => {
    const supabase = createClient();
    await supabase.from('inventory_items').update({ is_active: !item.is_active }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !item.is_active } : i));
  };
 
  const uploadImage = async (file: File) => {
    const supabase = createClient();
    const path = `${id}/inventory/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('enterprise-assets').upload(path, file);
    if (error) { alert('Erreur upload: ' + error.message); return; }
    const { data: urlData } = supabase.storage.from('enterprise-assets').getPublicUrl(path);
    setItemForm((prev: any) => ({ ...prev, image_url: urlData.publicUrl }));
  };
 
  // ── ATTR HELPERS ─────────────────────────────────────────────────────────────
 
  const addAttr = () => setAttrSchema(prev => [...prev, { key: `attr_${Date.now()}`, label: '', type: 'text', required: false }]);
  const updateAttr = (i: number, field: string, val: any) => setAttrSchema(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val, key: field === 'label' ? val.toLowerCase().replace(/\s+/g, '_') : a.key } : a));
  const removeAttr = (i: number) => setAttrSchema(prev => prev.filter((_, idx) => idx !== i));
 
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-2 h-2 bg-[#4ade80] rounded-full shadow-[0_0_20px_#4ade80] animate-pulse" />
    </div>
  );
 
  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
 
      {/* ── HEADER ── */}
      <div className="border-b border-white/5 bg-[#080808] sticky top-0 z-20 backdrop-blur-md">
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full shadow-[0_0_8px_#4ade80] animate-pulse" />
            <div>
              <p className="text-[9px] text-white/30 tracking-[0.4em] uppercase">Catalogue Intelligent // Universal</p>
              <h1 className="text-2xl font-bold text-white tracking-tighter mt-0.5">INVENTORY_CORE</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Quota pills */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider flex items-center gap-2 ${catLimitReached ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 bg-white/5 text-white/40'}`}>
                <Layers className="w-3 h-3" />
                {categories.length}/{planDef?.max_inventory_categories === -1 ? '∞' : planDef?.max_inventory_categories ?? 5} CATS
              </div>
              <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider flex items-center gap-2 ${itemLimitReached ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' : 'border-white/10 bg-white/5 text-white/40'}`}>
                <Package className="w-3 h-3" />
                {items.length}/{planDef?.max_inventory_items === -1 ? '∞' : planDef?.max_inventory_items ?? 20} ITEMS
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            {/* View toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
              {(['table', 'grid'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`p-1.5 rounded-md transition-all ${viewMode === v ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                  {v === 'table' ? <List className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
            <button
              onClick={openAddCat}
              disabled={catLimitReached}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-white/60 border border-white/10 rounded-lg hover:border-white/20 hover:text-white transition-all uppercase tracking-wider disabled:opacity-30"
            >
              <Layers className="w-3 h-3" /> Catégorie
            </button>
            <button
              onClick={() => openAddItem()}
              disabled={itemLimitReached || categories.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-black bg-[#4ade80] rounded-lg hover:bg-[#3bc870] transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(74,222,128,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" /> Ajouter Item
            </button>
          </div>
        </div>
 
        {/* ── CATEGORY TABS ── */}
        <div className="px-8 flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-shrink-0 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'ALL' ? 'border-[#4ade80] text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
          >
            Tous ({items.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === cat.id ? 'text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
              style={{ borderBottomColor: activeTab === cat.id ? cat.color : 'transparent' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              {cat.name}
              <span className="text-white/20">({items.filter(i => i.category_id === cat.id).length})</span>
            </button>
          ))}
        </div>
      </div>
 
      {/* ── TOOLBAR ── */}
      <div className="px-8 py-4 flex items-center gap-3 border-b border-white/5">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-white/20 transition-all">
          <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher un item..."
            className="bg-transparent text-white text-[12px] outline-none placeholder:text-white/20 flex-1"
          />
          {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 text-white/30 hover:text-white" /></button>}
        </div>
        <p className="text-[10px] text-white/20 tracking-wider ml-auto">
          {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}
        </p>
      </div>
 
      {/* ── CONTENT ── */}
      <div className="px-8 py-6">
 
        {/* Empty state */}
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Package className="w-7 h-7 text-white/20" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[13px] font-bold text-white/40 uppercase tracking-[0.3em]">Aucune catégorie</p>
              <p className="text-[11px] text-white/20 max-w-xs">Créez d'abord une catégorie pour organiser vos produits ou services</p>
            </div>
            <button onClick={openAddCat} className="flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold text-black bg-[#4ade80] rounded-lg hover:bg-[#3bc870] transition-all uppercase tracking-wider">
              <Plus className="w-3.5 h-3.5" /> Créer une catégorie
            </button>
          </div>
        )}
 
        {/* TABLE VIEW */}
        {categories.length > 0 && viewMode === 'table' && (
          <div className="bg-[#0D0D0D] border border-white/8 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    { key: 'name', label: 'Produit / Service' },
                    { key: 'category', label: 'Catégorie' },
                    { key: 'price', label: 'Prix' },
                    { key: 'attributes', label: 'Attributs' },
                    { key: 'stock_status', label: 'Stock' },
                    { key: 'is_active', label: 'Statut' },
                    { key: 'actions', label: '' },
                  ].map(col => (
                    <th key={col.key}
                      onClick={() => { if (col.key !== 'actions' && col.key !== 'attributes') { setSortDir(sortField === col.key && sortDir === 'asc' ? 'desc' : 'asc'); setSortField(col.key); }}}
                      className={`text-left px-4 py-3 text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] ${col.key !== 'actions' && col.key !== 'attributes' ? 'cursor-pointer hover:text-white/60' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        {col.key !== 'actions' && col.key !== 'attributes' && <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <p className="text-[10px] text-white/20 uppercase tracking-widest">Aucun item trouvé</p>
                    </td>
                  </tr>
                ) : filteredItems.map((item, idx) => {
                  const cat = categories.find(c => c.id === item.category_id);
                  const stock = STOCK_CONFIG[item.stock_status] || STOCK_CONFIG.AVAILABLE;
                  const attrEntries = Object.entries(item.attributes || {}).slice(0, 3);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-all group ${!item.is_active ? 'opacity-40' : ''}`}
                    >
                      {/* Produit */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-white/20" />
                            )}
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-white truncate max-w-[180px]">{item.name}</p>
                            {item.description && <p className="text-[10px] text-white/30 truncate max-w-[180px] mt-0.5">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Catégorie */}
                      <td className="px-4 py-3">
                        {cat && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: cat.color + '15', border: `1px solid ${cat.color}30`, color: cat.color }}>
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </span>
                        )}
                      </td>
                      {/* Prix */}
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-bold text-[#4ade80]">
                          {item.price > 0 ? item.price.toLocaleString('fr-FR') : '—'}
                          {item.price > 0 && <span className="text-white/30 font-normal text-[10px] ml-1">{item.currency}</span>}
                        </p>
                        {item.unit !== 'unité' && <p className="text-[9px] text-white/20">/ {item.unit}</p>}
                      </td>
                      {/* Attributs */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {attrEntries.map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 bg-white/5 border border-white/8 rounded text-[9px] text-white/40 uppercase tracking-wider">
                              {k}: <span className="text-white/60">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                            </span>
                          ))}
                          {Object.keys(item.attributes || {}).length === 0 && (
                            <span className="text-[9px] text-white/15">—</span>
                          )}
                        </div>
                      </td>
                      {/* Stock */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: stock.bg, color: stock.color, border: `1px solid ${stock.color}30` }}>
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: stock.color }} />
                          {stock.label}
                        </span>
                      </td>
                      {/* Statut */}
                      <td className="px-4 py-3">
                        <button onClick={() => toggleItem(item)}
                          className={`relative w-9 h-5 rounded-full transition-all ${item.is_active ? 'bg-[#4ade80]/30' : 'bg-white/10'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all shadow-sm ${item.is_active ? 'left-[18px] bg-[#4ade80]' : 'left-0.5 bg-white/30'}`} />
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative">
                            <button onClick={() => setContextItemId(contextItemId === item.id ? null : item.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                              {contextItemId === item.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setContextItemId(null)} />
                                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-8 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 p-1">
                                    <button onClick={() => { openEditItem(item); setContextItemId(null); }}
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-[11px] text-white/60 hover:text-white transition-all text-left">
                                      <Pencil className="w-3.5 h-3.5" /> Modifier
                                    </button>
                                    <button onClick={() => { toggleItem(item); setContextItemId(null); }}
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-[11px] text-white/60 hover:text-white transition-all text-left">
                                      {item.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      {item.is_active ? 'Désactiver' : 'Activer'}
                                    </button>
                                    <div className="my-1 border-t border-white/5" />
                                    <button onClick={() => deleteItem(item.id)}
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-[11px] text-red-400/60 hover:text-red-400 transition-all text-left">
                                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
 
        {/* GRID VIEW */}
        {categories.length > 0 && viewMode === 'grid' && (
          <div className="space-y-10">
            {categories.map(cat => {
              const catItems = filteredItems.filter(i => i.category_id === cat.id);
              if (activeTab !== 'ALL' && activeTab !== cat.id) return null;
              return (
                <div key={cat.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20', border: `1px solid ${cat.color}30` }}>
                        <Package className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      </div>
                      <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">{cat.name}</span>
                      <span className="text-[10px] text-white/20">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button onClick={() => openAddItem(cat)} disabled={itemLimitReached}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-black bg-[#4ade80] rounded-lg hover:bg-[#3bc870] transition-all uppercase tracking-wider disabled:opacity-30">
                      <Plus className="w-3 h-3" /> Ajouter
                    </button>
                  </div>
                  {catItems.length === 0 ? (
                    <div className="border border-dashed border-white/5 rounded-xl py-10 text-center">
                      <p className="text-[10px] text-white/15 uppercase tracking-widest">Aucun item dans cette catégorie</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {catItems.map(item => {
                        const stock = STOCK_CONFIG[item.stock_status] || STOCK_CONFIG.AVAILABLE;
                        return (
                          <motion.div key={item.id} whileHover={{ y: -2 }}
                            className={`bg-[#0D0D0D] border border-white/8 rounded-xl overflow-hidden group hover:border-white/20 transition-all ${!item.is_active ? 'opacity-40' : ''}`}>
                            <div className="h-28 bg-white/5 flex items-center justify-center relative overflow-hidden">
                              {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-7 h-7 text-white/10" />}
                              <div className="absolute top-2 right-2">
                                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase"
                                  style={{ backgroundColor: stock.bg, color: stock.color }}>{stock.label}</span>
                              </div>
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button onClick={() => openEditItem(item)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><Pencil className="w-3 h-3 text-white" /></button>
                                <button onClick={() => toggleItem(item)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><Eye className="w-3 h-3 text-white" /></button>
                                <button onClick={() => deleteItem(item.id)} className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"><Trash2 className="w-3 h-3 text-red-400" /></button>
                              </div>
                            </div>
                            <div className="p-3 space-y-1.5">
                              <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                              <p className="text-[11px] font-bold text-[#4ade80]">
                                {item.price > 0 ? `${item.price.toLocaleString('fr-FR')} ${item.currency}` : 'Sur demande'}
                                {item.unit !== 'unité' && <span className="text-white/20 font-normal text-[9px] ml-1">/{item.unit}</span>}
                              </p>
                              {Object.entries(item.attributes || {}).slice(0, 2).map(([k, v]) => (
                                <p key={k} className="text-[9px] text-white/30 truncate">{k}: <span className="text-white/50">{String(v)}</span></p>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
 
        {/* CATEGORY MANAGER (bottom section) */}
        {categories.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-white/30" />
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">Gérer les catégories</span>
              </div>
              <button onClick={openAddCat} disabled={catLimitReached}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-white/50 border border-white/10 rounded-lg hover:border-white/20 hover:text-white transition-all uppercase tracking-wider disabled:opacity-30">
                <Plus className="w-3 h-3" /> Nouvelle catégorie
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-white/8 rounded-xl hover:border-white/15 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ backgroundColor: cat.color + '20', border: `1px solid ${cat.color}40` }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">{cat.name}</p>
                      <p className="text-[9px] text-white/30">{items.filter(i => i.category_id === cat.id).length} item(s) · {cat.attribute_schema?.length || 0} attr.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => deleteCat(cat)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
 
      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — CATÉGORIE
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCatModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
                  <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest">Configuration du cluster</p>
                </div>
                <button onClick={() => setShowCatModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"><X className="w-4 h-4" /></button>
              </div>
              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Nom de la catégorie *</label>
                    <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="Ex: Vêtements, Services, Appartements..."
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-[12px] outline-none focus:border-[#4ade80]/50 transition-all font-mono placeholder:text-white/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Couleur</label>
                    <div className="flex items-center gap-2">
                      {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => setCatForm({ ...catForm, color: c })}
                          className={`w-6 h-6 rounded-full transition-all ${catForm.color === c ? 'scale-125 ring-2 ring-white/40 ring-offset-1 ring-offset-black' : 'hover:scale-110'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Description (optionnel)</label>
                  <input value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                    placeholder="Description courte de cette catégorie..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-[12px] outline-none focus:border-[#4ade80]/50 transition-all font-mono placeholder:text-white/20" />
                </div>
 
                {/* Attribute Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
                      Attributs spécifiques
                    </label>
                    <span className="text-[9px] text-white/20">{attrSchema.length} attribut(s)</span>
                  </div>
 
                  {attrSchema.length === 0 && (
                    <div className="border border-dashed border-white/5 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-white/20">Aucun attribut défini</p>
                    </div>
                  )}
 
                  <div className="space-y-2">
                    {attrSchema.map((attr, i) => (
                      <div key={i} className="bg-[#0a0a0a] border border-white/8 rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input value={attr.label} onChange={e => updateAttr(i, 'label', e.target.value)}
                            placeholder="Nom"
                            className="bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white text-[11px] outline-none focus:border-[#4ade80]/40 placeholder:text-white/20" />
                          <select value={attr.type} onChange={e => updateAttr(i, 'type', e.target.value)}
                            className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-[11px] outline-none focus:border-[#4ade80]/40">
                            <option value="text">Texte</option>
                            <option value="number">Nombre</option>
                            <option value="boolean">Oui/Non</option>
                            <option value="select">Select</option>
                            <option value="multiselect">Multi-select</option>
                            <option value="date">Date</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeAttr(i)} className="ml-auto p-1 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"><X className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
 
                  <button onClick={addAttr}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/10 rounded-xl text-[11px] text-white/30 hover:text-white/60 hover:border-white/20 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Ajouter un attribut
                  </button>
                </div>
              </div>
              {/* Footer */}
              <div className="p-6 border-t border-white/5 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowCatModal(false)} className="px-6 py-2.5 text-[11px] font-bold text-white/40 rounded-lg bg-white/5 hover:bg-white/10 transition-all uppercase tracking-wider">Annuler</button>
                <button onClick={saveCat} className="px-6 py-2.5 text-[11px] font-bold text-black bg-[#4ade80] rounded-lg hover:bg-[#3bc870] transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                  {editingCat ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — ITEM
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" >
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowItemModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">{editingItem ? 'Modifier' : 'Ajouter'}</h2>
                    <button onClick={() => setShowItemModal(false)}><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Simplified Form */}
                    <input value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-2 text-sm rounded mb-4" placeholder="Nom" />
                    <input type="number" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-2 text-sm rounded mb-4" placeholder="Prix" />
                    {selectedCategory?.attribute_schema?.map(field => (
                        <div key={field.key} className="space-y-2">
                             <label className="text-[10px] uppercase text-white/40">{field.label}</label>
                             <AttributeInput field={field} value={itemForm.attributes[field.key]} onChange={val => setItemForm((p:any) => ({...p, attributes: {...p.attributes, [field.key]: val}}))} />
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t border-white/5 flex justify-end gap-2">
                    <button onClick={() => setShowItemModal(false)} className="px-4 py-2 text-sm text-white/40">Annuler</button>
                    <button onClick={saveItem} className="px-4 py-2 text-sm bg-[#4ade80] text-black font-bold rounded">Sauvegarder</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
