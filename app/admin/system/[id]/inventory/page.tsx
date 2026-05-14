"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  FolderOpen, 
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';

// Components
import { InventorySidebar } from './components/InventorySidebar';
import { CategoryModal } from './components/CategoryModal';
import { ItemModal } from './components/ItemModal';
import { ItemCard } from './components/ItemCard';

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
  is_active: boolean;
  stock_status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  attributes: Record<string, any>;
  tags: string[];
  sort_order: number;
  created_at: string;
}

export default function InventoryPage() {
  const params = useParams();
  const id = params?.id as string;
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
    if (id) loadData();
  }, [id]);

  // CATEGORY LOGIC
  const handleSaveCategory = async (form: Partial<Category>, schema: AttributeField[]) => {
    if (!form.name?.trim()) { alert('Nom de catégorie requis'); return; }
    const supabase = createClient();
    const payload = {
      enterprise_id: id,
      name: form.name.trim(),
      description: form.description || null,
      color: form.color || '#4ade80',
      attribute_schema: schema,
      is_active: form.is_active ?? true,
      sort_order: form.sort_order ?? 0
    };

    if (editingCategory) {
      const { error } = await supabase.from('inventory_categories').update(payload).eq('id', editingCategory.id);
      if (error) { alert(error.message); return; }
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...payload } as Category : c));
    } else {
      if (planDef && categories.length >= (planDef.max_categories || 20)) {
        alert('Limite de catégories atteinte.');
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

  // ITEM LOGIC
  const handleSaveItem = async (form: Partial<InventoryItem>) => {
    if (!form.name?.trim()) { alert('Nom de l\'item requis'); return; }
    if (!selectedCategory) { alert('Catégorie non sélectionnée'); return; }
    const supabase = createClient();
    const payload = {
      enterprise_id: id,
      category_id: selectedCategory.id,
      name: form.name.trim(),
      description: form.description || null,
      price: form.price || 0,
      currency: form.currency || 'FCFA',
      unit: form.unit || 'unité',
      image_url: form.image_url || null,
      is_active: form.is_active ?? true,
      stock_status: form.stock_status || 'AVAILABLE',
      attributes: form.attributes || {},
      tags: form.tags || [],
      sort_order: form.sort_order ?? 0
    };

    if (editingItem) {
      const { error } = await supabase.from('inventory_items').update(payload).eq('id', editingItem.id);
      if (error) { alert(error.message); return; }
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } as InventoryItem : i));
    } else {
      if (planDef && items.length >= (planDef.max_inventory_items || 200)) {
        alert('Limite d\'items atteinte.');
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

  const handleUploadImage = async (file: File) => {
    const supabase = createClient();
    const path = `${id}/inventory/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('enterprise-assets').upload(path, file);
    if (error) { alert('Erreur upload: ' + error.message); return; }
    const { data: urlData } = supabase.storage.from('enterprise-assets').getPublicUrl(path);
    return urlData.publicUrl;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white/20 font-mono text-xs uppercase tracking-widest">
      Neural_Inventory_Loading...
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-white font-mono selection:bg-[#4ade80]/30 selection:text-black">
      
      <aside className="w-72 border-r border-white/5 flex flex-col p-8 fixed h-screen overflow-y-auto">
        <InventorySidebar 
          categoriesCount={categories.length}
          itemsCount={items.length}
          maxCategories={planDef?.max_categories || 20}
          maxItems={planDef?.max_inventory_items || 200}
          activePage={activePage}
          setActivePage={setActivePage}
          onAddCategory={() => {
            setEditingCategory(null);
            setShowCategoryModal(true);
          }}
        />
      </aside>

      <main className="flex-1 ml-72 p-12 overflow-y-auto">
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

        <div className="space-y-12">
          {activePage === 'CATALOGUE' && (
            <div className="space-y-12">
              {categories.length === 0 ? (
                <div className="border border-dashed border-white/5 rounded-3xl p-20 text-center space-y-6">
                  <FolderOpen className="w-12 h-12 text-white/5 mx-auto" />
                  <p className="text-xs text-white/20 uppercase tracking-[0.3em]">No_Category_Nodes_Detected</p>
                  <button 
                    onClick={() => {
                      setEditingCategory(null);
                      setShowCategoryModal(true);
                    }}
                    className="px-6 py-3 bg-[#4ade80] text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#3bc870] transition-all"
                  >
                    + Establish_New_Category
                  </button>
                </div>
              ) : (
                categories.map(cat => {
                  const catItems = items.filter(i => i.category_id === cat.id);
                  return (
                    <motion.div key={cat.id} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}40`, color: cat.color }}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{cat.name}</h3>
                            <p className="text-[10px] text-white/30 tracking-widest">Lattice_Population: {catItems.length} Units</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCategory(cat);
                            setEditingItem(null);
                            setShowItemModal(true);
                          }}
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
                              onEdit={() => {
                                setSelectedCategory(cat);
                                setEditingItem(item);
                                setShowItemModal(true);
                              }} 
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
                    onClick={() => {
                      setEditingCategory(null);
                      setShowCategoryModal(true);
                    }}
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Plus className="w-4 h-4 text-[#4ade80]" /> Establishment_New_Lattice
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[#4ade80]/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl border flex items-center justify-center p-3" style={{ borderColor: `${cat.color}40`, backgroundColor: `${cat.color}10` }}>
                           <FolderOpen className="w-6 h-6" style={{ color: cat.color }} />
                         </div>
                         <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider">{cat.name}</h4>
                            <p className="text-[9px] text-white/40 uppercase tracking-widest">{items.filter(i => i.category_id === cat.id).length} items // {cat.attribute_schema?.length || 0} attributes</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all"><Pencil className="w-4 h-4" /></button>
                         {items.filter(i => i.category_id === cat.id).length === 0 && (
                           <button onClick={() => deleteCategory(cat.id)} className="p-3 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-red-500/40 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                         )}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activePage === 'ITEMS' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-white/60">Global_Asset_Lattice</h2>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" placeholder="Neural_Search_Assets..." className="bg-white/5 border border-white/5 rounded-xl px-12 py-3 text-xs outline-none focus:border-[#4ade80]/40 transition-all w-80 font-mono" />
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
                        onEdit={() => { setSelectedCategory(cat); setEditingItem(item); setShowItemModal(true); }} 
                        onDelete={() => deleteItem(item.id)} 
                        onToggle={() => toggleItem(item)} 
                      />
                    );
                 })}
              </div>
            </div>
          )}
        </div>

        {/* MODALS */}
        <CategoryModal 
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategory}
          editingCategory={editingCategory}
        />

        <ItemModal 
          isOpen={showItemModal}
          onClose={() => setShowItemModal(false)}
          onSave={handleSaveItem}
          onUploadImage={handleUploadImage}
          editingItem={editingItem}
          selectedCategory={selectedCategory}
        />

      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(74, 222, 128, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(74, 222, 128, 0.2); }
      `}</style>
    </div>
  );
}
