"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  LayoutGrid, 
  FolderOpen, 
  X, 
  Upload, 
  Check, 
  ChevronDown,
  Search,
  Zap,
  Tag,
  DollarSign,
  Box,
  AlertTriangle,
  MoreVertical,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';

// --- TYPES ---
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
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  unit: string;
  image_url: string | null;
  images: string[];
  is_active: boolean;
  stock_status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  attributes: Record<string, any>;
  tags: string[];
  sort_order: number;
  created_at: string;
}

// --- COMPONENTS ---

function ItemCard({ item, category, onEdit, onDelete, onToggle }: { 
  item: InventoryItem, 
  category: Category, 
  onEdit: () => void, 
  onDelete: () => void, 
  onToggle: () => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#111] border rounded-xl overflow-hidden group transition-all hover:border-white/20 ${item.is_active ? 'border-white/10' : 'border-white/5 opacity-50'}`}
    >
      {/* Image */}
      <div className="h-32 bg-white/5 flex items-center justify-center relative overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-8 h-8 text-white/10" />
        )}
        {/* Badge stock */}
        <div className={`absolute top-2 right-2 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          item.stock_status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' :
          item.stock_status === 'OUT_OF_STOCK' ? 'bg-red-500/20 text-red-400' :
          'bg-white/10 text-white/40'
        }`}>
          {item.stock_status === 'AVAILABLE' ? 'Dispo' : item.stock_status === 'OUT_OF_STOCK' ? 'Rupture' : 'Arrêté'}
        </div>
        {/* Actions hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
          <button onClick={onEdit} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={onToggle} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <Eye className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={onDelete} className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/40 transition-all">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      {/* Infos */}
      <div className="p-3 space-y-1.5">
        <p className="text-[12px] font-bold text-white truncate font-mono uppercase tracking-wider">{item.name}</p>
        <p className="text-[11px] text-[#4ade80] font-bold font-mono">
          {item.price > 0 ? `${item.price.toLocaleString()} ${item.currency}` : 'Prix sur demande'}
          {item.unit !== 'unité' && <span className="text-white/30 font-normal"> / {item.unit}</span>}
        </p>
        {/* Attributs dynamiques — affiche les 2 premiers */}
        <div className="pt-1 space-y-0.5">
          {Object.entries(item.attributes || {}).slice(0, 2).map(([key, val]) => (
            <p key={key} className="text-[9px] text-white/30 uppercase tracking-wider font-mono">
              {key.split('_').join(' ')}: <span className="text-white/50">{String(val)}</span>
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// --- MAIN PAGE ---

export default function InventoryPage() {
  const { id } = useParams() as { id: string };
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [planDef, setPlanDef] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('CATALOGUE');
  
  // Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Forms
  const [itemForm, setItemForm] = useState<Partial<InventoryItem>>({
    name: '',
    description: '',
    price: 0,
    currency: 'FCFA',
    unit: 'unité',
    image_url: '',
    is_active: true,
    stock_status: 'AVAILABLE',
    attributes: {},
    tags: []
  });

  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    description: '',
    color: '#4ade80',
    attribute_schema: [],
    is_active: true
  });

  const [attrSchema, setAttrSchema] = useState<AttributeField[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      
      const { data: enterprise } = await supabase
        .from('enterprises')
        .select('package_type')
        .eq('id', id)
        .single();
        
      const { data: plan } = await supabase
        .from('plan_definitions')
        .select('*')
        .eq('plan_name', enterprise?.package_type)
        .single();
        
      const { data: cats } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('enterprise_id', id)
        .order('sort_order');
        
      const { data: its } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('enterprise_id', id)
        .order('sort_order');
        
      setPlanDef(plan);
      setCategories(cats || []);
      setItems(its || []);
      setLoading(false);
    };
    loadData();
  }, [id]);

  // CATEGORY LOGIC
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      color: '#4ade80',
      attribute_schema: [],
      is_active: true
    });
    setAttrSchema([]);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ ...cat });
    setAttrSchema(cat.attribute_schema || []);
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name?.trim()) { alert('Nom de catégorie requis'); return; }
    const supabase = createClient();
    const payload = {
      enterprise_id: id,
      name: categoryForm.name.trim(),
      description: categoryForm.description || null,
      color: categoryForm.color || '#4ade80',
      attribute_schema: attrSchema,
      is_active: categoryForm.is_active ?? true,
      sort_order: categoryForm.sort_order ?? 0
    };

    if (editingCategory) {
      const { error } = await supabase.from('inventory_categories').update(payload).eq('id', editingCategory.id);
      if (error) { alert(error.message); return; }
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...payload } as Category : c));
    } else {
      // Check plan limit
      if (planDef && categories.length >= (planDef.max_categories || 20)) {
        alert('Limite de catégories atteinte pour votre plan.');
        return;
      }
      const { data, error } = await supabase.from('inventory_categories').insert(payload).select().single();
      if (error) { alert(error.message); return; }
      setCategories(prev => [...prev, data as Category]);
    }
    setShowCategoryModal(false);
  };

  const deleteCategory = async (catId: string) => {
    const hasItems = items.some(i => i.category_id === catId);
    if (hasItems) { alert('Impossible de supprimer une catégorie contenant des items.'); return; }
    if (!confirm('Supprimer cette catégorie ?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('inventory_categories').delete().eq('id', catId);
    if (error) { alert(error.message); return; }
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  const updateAttr = (index: number, field: keyof AttributeField, value: any) => {
    const newSchema = [...attrSchema];
    (newSchema[index] as any)[field] = value;
    setAttrSchema(newSchema);
  };

  const removeAttr = (index: number) => {
    setAttrSchema(prev => prev.filter((_, i) => i !== index));
  };

  // ITEM LOGIC
  const openAddItem = (cat: Category) => {
    setSelectedCategory(cat);
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: 0,
      currency: 'FCFA',
      unit: 'unité',
      image_url: '',
      is_active: true,
      stock_status: 'AVAILABLE',
      attributes: {},
      tags: []
    });
    setShowItemModal(true);
  };

  const openEditItem = (item: InventoryItem, cat: Category) => {
    setSelectedCategory(cat);
    setEditingItem(item);
    setItemForm({ ...item });
    setShowItemModal(true);
  };

  const saveItem = async () => {
    if (!itemForm.name?.trim()) { alert('Nom de l\'item requis'); return; }
    if (!selectedCategory) { alert('Catégorie non sélectionnée'); return; }
    const supabase = createClient();
    const payload = {
      enterprise_id: id,
      category_id: selectedCategory.id,
      name: itemForm.name.trim(),
      description: itemForm.description || null,
      price: itemForm.price || 0,
      currency: itemForm.currency || 'FCFA',
      unit: itemForm.unit || 'unité',
      image_url: itemForm.image_url || null,
      is_active: itemForm.is_active ?? true,
      stock_status: itemForm.stock_status || 'AVAILABLE',
      attributes: itemForm.attributes || {},
      tags: itemForm.tags || [],
      sort_order: itemForm.sort_order ?? 0
    };

    if (editingItem) {
      const { error } = await supabase.from('inventory_items').update(payload).eq('id', editingItem.id);
      if (error) { alert(error.message); return; }
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } as InventoryItem : i));
    } else {
      // Check plan limit
      if (planDef && items.length >= (planDef.max_inventory_items || 200)) {
        alert('Limite d\'items atteinte pour votre plan.');
        return;
      }
      const { data, error } = await supabase.from('inventory_items').insert(payload).select().single();
      if (error) { alert(error.message); return; }
      setItems(prev => [...prev, data as InventoryItem]);
    }
    setShowItemModal(false);
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Supprimer cet item ?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
    if (error) { alert(error.message); return; }
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const toggleItem = async (item: InventoryItem) => {
    const supabase = createClient();
    const { error } = await supabase.from('inventory_items').update({ is_active: !item.is_active }).eq('id', item.id);
    if (error) { alert(error.message); return; }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !item.is_active } : i));
  };

  const uploadImage = async (file: File) => {
    const supabase = createClient();
    const path = `${id}/inventory/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('enterprise-assets').upload(path, file);
    if (error) { alert('Erreur upload: ' + error.message); return; }
    const { data: urlData } = supabase.storage.from('enterprise-assets').getPublicUrl(path);
    setItemForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white/20 font-mono text-xs uppercase tracking-widest">
      Neural_Inventory_Loading...
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-white font-mono selection:bg-[#4ade80]/30 selection:text-black">
      
      {/* SIDEBAR */}
      <aside className="w-72 border-r border-white/5 flex flex-col p-8 fixed h-screen overflow-y-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Structure_Lattice</h3>
            <nav className="space-y-2">
              {[
                { id: 'CATALOGUE', label: 'Catalogue', icon: LayoutGrid },
                { id: 'CATÉGORIES', label: 'Catégories', icon: FolderOpen },
                { id: 'ITEMS', label: 'Items', icon: Package },
              ].map(page => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all border group ${
                    activePage === page.id 
                      ? 'bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]' 
                      : 'border-transparent text-white/20 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  <page.icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{page.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* METRICS */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Resource_Quota</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                 <p className="text-[8px] text-white/40 uppercase tracking-widest">Catégories_Deployed</p>
                 <div className="flex justify-between items-end">
                    <span className={`text-sm font-bold ${categories.length >= (planDef?.max_categories || 20) * 0.8 ? 'text-orange-400' : 'text-[#4ade80]'}`}>
                      {categories.length} / {planDef?.max_categories || 20}
                    </span>
                    <span className="text-[8px] text-white/20 uppercase">Units</span>
                 </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                 <p className="text-[8px] text-white/40 uppercase tracking-widest">Inventory_Items</p>
                 <div className="flex justify-between items-end">
                    <span className={`text-sm font-bold ${items.length >= (planDef?.max_inventory_items || 200) * 0.8 ? 'text-orange-400' : 'text-[#4ade80]'}`}>
                      {items.length} / {planDef?.max_inventory_items || 200}
                    </span>
                    <span className="text-[8px] text-white/20 uppercase">Units</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-72 p-12 overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#4ade80] rounded-full shadow-[0_0_10px_#4ade80] animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 tracking-[0.4em] uppercase">
                Catalogue Intelligent // Universal
              </span>
            </div>
            <h1 className="text-5xl font-normal text-white tracking-tighter uppercase">{activePage}_CORE</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Enterprise_ID</p>
            <p className="text-xs font-bold text-white/60 tracking-wider">0X-{id?.substring(0,8).toUpperCase()}</p>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="space-y-12">
          
          {activePage === 'CATALOGUE' && (
            <div className="space-y-12">
              {categories.length === 0 ? (
                <div className="border border-dashed border-white/5 rounded-3xl p-20 text-center space-y-6">
                  <FolderOpen className="w-12 h-12 text-white/5 mx-auto" />
                  <p className="text-xs text-white/20 uppercase tracking-[0.3em]">No_Category_Nodes_Detected</p>
                  <button 
                    onClick={openAddCategory}
                    className="px-6 py-3 bg-[#4ade80] text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#3bc870] transition-all"
                  >
                    + Establish_New_Category
                  </button>
                </div>
              ) : (
                categories.map(cat => {
                  const catItems = items.filter(i => i.category_id === cat.id);
                  return (
                    <motion.div 
                      key={cat.id} 
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center border"
                            style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}40`, color: cat.color }}
                          >
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{cat.name}</h3>
                            <p className="text-[10px] text-white/30 tracking-widest">Lattice_Population: {catItems.length} Units</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openAddItem(cat)}
                          className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-black bg-[#4ade80] rounded-xl hover:bg-[#3bc870] transition-all tracking-wider uppercase"
                        >
                          <Plus className="w-3.5 h-3.5" /> Inject_Asset
                        </button>
                      </div>

                      {catItems.length === 0 ? (
                        <div className="border border-dashed border-white/5 rounded-2xl p-12 text-center">
                          <p className="text-[10px] text-white/20 uppercase tracking-widest">No_System_Assets_Found_In_This_Cluster</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {catItems.map(item => (
                            <ItemCard 
                              key={item.id} 
                              item={item} 
                              category={cat} 
                              onEdit={() => openEditItem(item, cat)} 
                              onDelete={() => deleteItem(item.id)} 
                              onToggle={() => toggleItem(item)} 
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {activePage === 'CATÉGORIES' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-white/60">Manage_Categories</h2>
                  <button 
                    onClick={openAddCategory}
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Plus className="w-4 h-4 text-[#4ade80]" /> Establishment_New_Lattice
                  </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map(cat => {
                    const count = items.filter(i => i.category_id === cat.id).length;
                    return (
                      <div key={cat.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[#4ade80]/20 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl border flex items-center justify-center p-3" style={{ borderColor: `${cat.color}40`, backgroundColor: `${cat.color}10` }}>
                             <FolderOpen className="w-6 h-6" style={{ color: cat.color }} />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold uppercase tracking-wider">{cat.name}</h4>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest">{count} items // {cat.attribute_schema?.length || 0} attributes</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => openEditCategory(cat)}
                             className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"
                           >
                             <Pencil className="w-4 h-4" />
                           </button>
                           {count === 0 && (
                             <button 
                               onClick={() => deleteCategory(cat.id)}
                               className="p-3 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-red-500/40 hover:text-red-500 transition-all"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {activePage === 'ITEMS' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-white/60">Global_Asset_Lattice</h2>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Neural_Search_Assets..."
                      className="bg-white/5 border border-white/5 rounded-xl px-12 py-3 text-xs outline-none focus:border-[#4ade80]/40 transition-all w-80 font-mono"
                    />
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {items.map(item => {
                    const cat = categories.find(c => c.id === item.category_id);
                    if (!cat) return null;
                    return (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        category={cat} 
                        onEdit={() => openEditItem(item, cat)} 
                        onDelete={() => deleteItem(item.id)} 
                        onToggle={() => toggleItem(item)} 
                      />
                    );
                 })}
              </div>
            </div>
          )}

        </div>

        {/* MODAL CATEGORY */}
        <AnimatePresence>
          {showCategoryModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-24">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setShowCategoryModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold uppercase tracking-[0.2em]">{editingCategory ? 'Update' : 'Establish'}_Category_Node</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Neural Configuration Lattice</p>
                  </div>
                  <button onClick={() => setShowCategoryModal(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Category_Name</label>
                        <input 
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-6 py-4 text-xs font-bold text-white uppercase tracking-widest outline-none focus:border-[#4ade80]/40 transition-all"
                          placeholder="Lattice_Identifier"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Cluster_Color_Node</label>
                        <div className="grid grid-cols-8 gap-2">
                           {['#4ade80', '#c084fc', '#f472b6', '#38bdf8', '#fbbf24', '#f87171', '#94a3b8', '#ffffff'].map(c => (
                             <button
                               key={c}
                               onClick={() => setCategoryForm({...categoryForm, color: c})}
                               className={`w-full aspect-square rounded-lg border transition-all ${categoryForm.color === c ? 'scale-110 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-transparent'}`}
                               style={{ backgroundColor: c }}
                             />
                           ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Node_Description</label>
                      <textarea 
                        value={categoryForm.description || ''}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        className="w-full h-[180px] bg-[#0D0D0D] border border-white/10 rounded-xl px-6 py-4 text-xs text-white/60 outline-none focus:border-[#4ade80]/40 transition-all resize-none"
                        placeholder="Detailed lattice specification..."
                      />
                    </div>
                  </div>

                  {/* ATTRIBUTES BUILDER */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                       <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Dynamic_Attribute_Schema</h3>
                       <button
                         onClick={() => setAttrSchema(prev => [...prev, { key: `attr_${Date.now()}`, label: '', type: 'text', required: false }])}
                         className="flex items-center gap-2 text-[9px] font-bold text-[#4ade80] uppercase tracking-widest hover:text-[#3bc870] transition-colors"
                       >
                         <Plus className="w-3 h-3" /> Insert_Field
                       </button>
                    </div>
                    
                    <div className="space-y-4">
                      {attrSchema.length === 0 ? (
                        <div className="p-12 border border-dashed border-white/5 rounded-2xl text-center">
                           <p className="text-[10px] text-white/20 uppercase tracking-widest">No_Custom_Attributes_Assigned</p>
                        </div>
                      ) : (
                        attrSchema.map((attr, i) => (
                          <div key={i} className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl group relative">
                            <button 
                              onClick={() => removeAttr(i)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Field_Label</label>
                                <input
                                  value={attr.label}
                                  onChange={(e) => updateAttr(i, 'label', e.target.value)}
                                  placeholder="Ex: Taille..."
                                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] text-white outline-none focus:border-white/20"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Data_Type</label>
                                <select
                                  value={attr.type}
                                  onChange={(e) => updateAttr(i, 'type', e.target.value as any)}
                                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] text-white outline-none appearance-none font-mono"
                                >
                                  <option value="text">Texte libre</option>
                                  <option value="number">Nombre</option>
                                  <option value="boolean">Oui/Non</option>
                                  <option value="select">Liste choix unique</option>
                                  <option value="multiselect">Liste choix multiple</option>
                                  <option value="color">Couleur</option>
                                  <option value="date">Date</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-4 pt-6">
                                <label className="flex items-center gap-3 cursor-pointer group/cb">
                                  <div 
                                    onClick={() => updateAttr(i, 'required', !attr.required)}
                                    className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${attr.required ? 'bg-[#4ade80] border-[#4ade80]' : 'border-white/20 hover:border-white/40'}`}
                                  >
                                    {attr.required && <Check className="w-3 h-3 text-black" />}
                                  </div>
                                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest group-hover/cb:text-white/60 transition-colors">Mandatory</span>
                                </label>
                              </div>
                            </div>
                            
                            {(attr.type === 'select' || attr.type === 'multiselect') && (
                              <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Lattice_Options // Comma Separated</label>
                                <input
                                  value={(attr.options || []).join(', ')}
                                  onChange={(e) => updateAttr(i, 'options', e.target.value.split(',').map(s => s.trim()))}
                                  placeholder="Small, Medium, Large..."
                                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[11px] text-white/60 outline-none focus:border-white/20 italic"
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end gap-4">
                  <button onClick={() => setShowCategoryModal(false)} className="px-8 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors">Cancel_Abort</button>
                  <button 
                    onClick={saveCategory}
                    className="px-10 py-4 bg-[#4ade80] text-black text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[#3bc870] transition-all shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                  >
                    Commit_Lattice_Update
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL ITEM */}
        <AnimatePresence>
          {showItemModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                onClick={() => setShowItemModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.95, opacity: 0, x: 20 }}
                className="relative w-full max-w-5xl bg-black border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-full"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-white/5 border-white/10">
                      <Package className="w-6 h-6 text-[#4ade80]" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold uppercase tracking-[0.2em]">{editingItem ? 'Update' : 'Establish'}_Inventory_Unit</h2>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Cluster: {selectedCategory?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowItemModal(false)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar grid grid-cols-2 gap-12">
                   {/* LEFT COLUMN - CORE STATS */}
                   <div className="space-y-10">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Item_Identification_Title</label>
                          <input 
                            type="text"
                            value={itemForm.name}
                            onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                            className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-6 py-5 text-[13px] font-bold text-white outline-none focus:border-[#4ade80]/40 transition-all"
                            placeholder="Unit Identifier..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Valuation_Neural_Price</label>
                            <div className="relative">
                               <input 
                                type="number"
                                value={itemForm.price}
                                onChange={(e) => setItemForm({...itemForm, price: Number(e.target.value)})}
                                className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-6 py-5 text-[13px] font-bold text-white outline-none focus:border-[#4ade80]/40 transition-all pr-20"
                                placeholder="0.00"
                              />
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-white/20 uppercase">{itemForm.currency}</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Metric_Unit</label>
                             <input 
                                type="text"
                                value={itemForm.unit}
                                onChange={(e) => setItemForm({...itemForm, unit: e.target.value})}
                                className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl px-6 py-5 text-[13px] font-bold text-white outline-none focus:border-[#4ade80]/40 transition-all"
                                placeholder="Unité, Kg, Litre..."
                              />
                          </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Neural_Unit_Media</label>
                           <div 
                             className="border-2 border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-white/[0.01] hover:bg-white/[0.02] hover:border-[#4ade80]/20 transition-all group"
                             onClick={() => document.getElementById('item-img-upload')?.click()}
                           >
                             <input 
                               id="item-img-upload"
                               type="file" 
                               className="hidden" 
                               accept="image/*"
                               onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                             />
                             {itemForm.image_url ? (
                               <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                                  <img src={itemForm.image_url} className="w-full h-full object-cover transition-all group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                     <Upload className="w-6 h-6 text-white" />
                                  </div>
                               </div>
                             ) : (
                               <>
                                 <div className="p-4 rounded-full bg-white/5 text-white/20 group-hover:text-[#4ade80] transition-colors">
                                   <Upload className="w-6 h-6" />
                                 </div>
                                 <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] group-hover:text-white/60">Commit_Visual_Asset</p>
                               </>
                             )}
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Availability_Protocol</h3>
                         <div className="grid grid-cols-2 gap-4">
                            {[
                              { id: 'AVAILABLE', label: 'In_Stock', color: '#4ade80' },
                              { id: 'OUT_OF_STOCK', label: 'Rupture', color: '#f87171' },
                              { id: 'DISCONTINUED', label: 'Deprecated', color: '#94a3b8' },
                            ].map(status => (
                              <button
                                key={status.id}
                                onClick={() => setItemForm({...itemForm, stock_status: status.id as any})}
                                className={`px-6 py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                  itemForm.stock_status === status.id 
                                    ? `bg-[${status.color}] text-black border-[${status.color}] shadow-[0_0_15px_rgba(74,222,128,0.2)]`
                                    : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/10 hover:bg-white/[0.04]'
                                }`}
                                style={itemForm.stock_status === status.id ? { backgroundColor: status.color, color: '#000', borderColor: status.color } : {}}
                              >
                                {status.label}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   {/* RIGHT COLUMN - DYNAMIC ATTRIBUTES */}
                   <div className="space-y-10">
                      <div className="space-y-6">
                         <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Dynamic_Attribute_Matrix</h3>
                         <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                           {selectedCategory?.attribute_schema?.length === 0 ? (
                             <div className="p-12 border border-dashed border-white/5 rounded-2xl text-center">
                               <p className="text-[10px] text-white/10 uppercase tracking-widest">No_Category_Attributes_Defined</p>
                             </div>
                           ) : (
                             selectedCategory?.attribute_schema?.map((field: AttributeField) => (
                               <div key={field.key} className="space-y-3 p-6 bg-white/[0.01] border border-white/5 rounded-2xl">
                                 <label className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em] flex items-center justify-between">
                                   <span>{field.label}</span>
                                   {field.required && <span className="text-red-500/50 text-[7px] tracking-normal">! Required</span>}
                                 </label>
                                 
                                 {field.type === 'text' && (
                                   <input
                                     value={itemForm.attributes?.[field.key] || ''}
                                     onChange={(e) => setItemForm(prev => ({ ...prev, attributes: { ...prev.attributes, [field.key]: e.target.value }}))}
                                     className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-xs text-white outline-none focus:border-[#4ade80]/40 transition-all font-mono"
                                     placeholder={`Enter ${field.label}...`}
                                   />
                                 )}
                                 
                                 {field.type === 'number' && (
                                   <div className="relative">
                                      <input
                                        type="number"
                                        value={itemForm.attributes?.[field.key] || ''}
                                        onChange={(e) => setItemForm(prev => ({ ...prev, attributes: { ...prev.attributes, [field.key]: Number(e.target.value) }}))}
                                        className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-xs text-white outline-none focus:border-[#4ade80]/40 transition-all font-mono pr-16"
                                      />
                                      {field.unit && <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-white/20 font-bold uppercase">{field.unit}</div>}
                                   </div>
                                 )}
                                 
                                 {field.type === 'boolean' && (
                                   <div className="flex items-center gap-3">
                                     <button
                                       onClick={() => setItemForm(prev => ({ ...prev, attributes: { ...prev.attributes, [field.key]: true }}))}
                                       className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${itemForm.attributes?.[field.key] === true ? 'bg-[#4ade80]/20 border border-[#4ade80]/40 text-[#4ade80]' : 'bg-white/5 border border-white/5 text-white/20 hover:border-white/10'}`}
                                     >YES_TRUE</button>
                                     <button
                                       onClick={() => setItemForm(prev => ({ ...prev, attributes: { ...prev.attributes, [field.key]: false }}))}
                                       className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${itemForm.attributes?.[field.key] === false ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-white/5 border border-white/5 text-white/20 hover:border-white/10'}`}
                                     >NO_FALSE</button>
                                   </div>
                                 )}
                                 
                                 {field.type === 'select' && (
                                   <div className="relative">
                                      <select
                                        value={itemForm.attributes?.[field.key] || ''}
                                        onChange={(e) => setItemForm(prev => ({ ...prev, attributes: { ...prev.attributes, [field.key]: e.target.value }}))}
                                        className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-xs text-white outline-none appearance-none font-mono"
                                      >
                                        <option value="">Select_Value...</option>
                                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                   </div>
                                 )}
                                 
                                 {field.type === 'multiselect' && (
                                   <div className="flex flex-wrap gap-2">
                                     {field.options?.map(opt => {
                                       const selected = (itemForm.attributes?.[field.key] || []).includes(opt);
                                       return (
                                         <button
                                           key={opt}
                                           onClick={() => {
                                             const current = itemForm.attributes?.[field.key] || [];
                                             const newVal = selected ? current.filter((v: string) => v !== opt) : [...current, opt];
                                             setItemForm(prev => ({ ...prev, attributes: { ...prev.attributes, [field.key]: newVal }}));
                                           }}
                                           className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${selected ? 'bg-[#4ade80]/15 border-[#4ade80]/40 text-[#4ade80]' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'}`}
                                         >{opt}</button>
                                       );
                                     })}
                                   </div>
                                 )}
                               </div>
                             ))
                           )}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Neural_Tags_Lattice</h3>
                         <div className="flex flex-wrap gap-2 p-4 bg-[#0D0D0D] border border-white/10 rounded-2xl min-h-[60px]">
                           {(itemForm.tags || []).map((tag, i) => (
                             <span key={i} className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 text-white/40 text-[9px] font-bold rounded-lg uppercase tracking-widest group">
                               {tag}
                               <button onClick={() => setItemForm(prev => ({ ...prev, tags: (prev.tags || []).filter((_, j) => j !== i)}))} className="hover:text-red-400"><X className="w-2.5 h-2.5" /></button>
                             </span>
                           ))}
                           <input 
                              type="text" 
                              className="bg-transparent text-[10px] text-white outline-none flex-1 font-mono min-w-[120px] uppercase tracking-widest px-2"
                              placeholder="Insert_Tag_Code..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = e.currentTarget.value.trim().toUpperCase();
                                  if (val && !itemForm.tags?.includes(val)) {
                                    setItemForm(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                           />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-12 border-t border-white/5 bg-white/[0.01] flex justify-end gap-6 items-center">
                   <div className="mr-auto flex items-center gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group/node">
                        <div 
                          onClick={() => setItemForm({...itemForm, is_active: !itemForm.is_active})}
                          className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${itemForm.is_active ? 'bg-[#4ade80] border-[#4ade80]' : 'border-white/20'}`}
                        >
                          {itemForm.is_active && <Check className="w-4 h-4 text-black font-bold" />}
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Node_Active</span>
                      </label>
                   </div>
                  <button onClick={() => setShowItemModal(false)} className="px-8 py-4 text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] hover:text-white transition-colors">Abort_Sequence</button>
                  <button 
                    onClick={saveItem}
                    className="px-12 py-5 bg-[#4ade80] text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[#3bc870] transition-all shadow-[0_0_30px_rgba(74,222,128,0.2)]"
                  >
                    Commit_Inventory_Unit
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(74, 222, 128, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(74, 222, 128, 0.2);
        }
      `}</style>
    </div>
  );
}
