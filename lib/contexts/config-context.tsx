"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CLIENT_CONFIG, ClientConfig } from '@/lib/config/client-config';
import { supabase } from '@/lib/supabase/client';

interface ConfigContextType {
  config: ClientConfig;
  updateConfig: (newConfig: Partial<ClientConfig>) => Promise<void>;
  updateAgent: (agentId: string, updates: any) => Promise<void>;
  updateInventory: (items: any[]) => Promise<void>;
  updateStrategicMemory: (lesson: string, essence: string) => Promise<void>;
  purgeMemory: () => Promise<void>;
  simulateError: () => Promise<void>;
  isReady: boolean;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ClientConfig>(CLIENT_CONFIG);
  const [isReady, setIsReady] = useState(false);

  const fetchFullConfig = async () => {
    try {
      // 1. Fetch Business Config (Mandatory V3.2)
      const { data: entData, error: entError } = await supabase
        .from('business_config')
        .select('*')
        .limit(1)
        .single();

      if (entError && entError.code !== 'PGRST116') {
        console.warn("SQL_IDENTITY_NODE_UNREACHABLE: business_config table may be missing or restricted.");
      }

      // 2. Fetch Universal Inventory (Mandatory V3.2)
      const { data: invData, error: invError } = await supabase
        .from('universal_inventory')
        .select('*');

      if (invError) {
        console.warn("SQL_INVENTORY_NODE_UNREACHABLE: universal_inventory table may be missing.");
      }

      // 3. Fetch Strategic Memory (Mandatory V3.2) - All entries for Hub
      const { data: memData, error: memError } = await supabase
        .from('experience_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (memError) {
        console.warn("SQL_MEMORY_NODE_UNREACHABLE: experience_ledger table may be missing.");
      }

      // Construct the ClientConfig structure from the new V3.2 schema
      // We merge with local defaults to ensure stability if tables are missing
      const newConfig: ClientConfig = {
        ...CLIENT_CONFIG,
        identity: entData ? {
          ...CLIENT_CONFIG.identity,
          name: entData.business_name || CLIENT_CONFIG.identity.name,
          slogan: entData.industry_type || CLIENT_CONFIG.identity.slogan,
          accentColor: entData.accent_color || CLIENT_CONFIG.identity.accentColor,
        } : CLIENT_CONFIG.identity,
        assets: {
          ...CLIENT_CONFIG.assets,
          inventory: invData ? invData.map((item: any) => ({
            id: item.id,
            title: item.item_name,
            category: item.category,
            price: item.price?.toString() || '0',
            img: '', 
            priority: 5,
            status: item.is_active ? 'In Stock' : 'Out of Stock',
            description: item.description || '',
            createdAt: item.created_at || new Date().toISOString()
          })) : CLIENT_CONFIG.assets.inventory
        },
        ai: {
          ...CLIENT_CONFIG.ai,
          support: {
            ...CLIENT_CONFIG.ai.support,
            instructions: entData?.system_instructions_support || CLIENT_CONFIG.ai.support.instructions,
          },
          dev: {
            ...CLIENT_CONFIG.ai.dev,
            instructions: entData?.system_instructions_dev || CLIENT_CONFIG.ai.dev.instructions,
          },
          memory: {
            ...CLIENT_CONFIG.ai.memory,
            strategicEssence: memData?.[0]?.strategic_essence || CLIENT_CONFIG.ai.memory.strategicEssence,
            experiences: memData ? memData.map((m: any, i: number) => ({ 
              cycle: memData.length - i, 
              lesson: m.lesson_learned,
              date: new Date(m.created_at).toISOString().split('T')[0]
            })) : CLIENT_CONFIG.ai.memory.experiences
          }
        }
      };

      setConfig(newConfig);
      setIsReady(true);
    } catch (e) {
      console.error("Neural Triad V3.2: Critical synchronization failure. Operating on local memory safeguards.", e);
      setIsReady(true);
    }
  };

  useEffect(() => {
    fetchFullConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<ClientConfig>) => {
    if (newConfig.identity) {
      // Mapping to V3.2 business_config
      const { data: current } = await supabase.from('business_config').select('id').limit(1).single();
      
      const payload = {
        business_name: newConfig.identity.name,
        industry_type: newConfig.identity.slogan,
        accent_color: newConfig.identity.accentColor,
        updated_at: new Date().toISOString()
      };

      if (current?.id) {
        await supabase.from('business_config').update(payload).eq('id', current.id);
      } else {
        await supabase.from('business_config').insert(payload);
      }
    }
    await fetchFullConfig();
  };

  const updateAgent = async (agentId: string, updates: any) => {
    const { data: current } = await supabase.from('business_config').select('id').limit(1).single();
    const colName = agentId === 'support' ? 'system_instructions_support' : 'system_instructions_dev';
    
    if (colName && current?.id) {
      await supabase.from('business_config').update({
        [colName]: updates.instructions,
        updated_at: new Date().toISOString()
      }).eq('id', current.id);
    }
    
    await fetchFullConfig();
  };

  const updateInventory = async (items: any[]) => {
    for (const item of items) {
      await supabase.from('universal_inventory').upsert({
        id: item.id && item.id.length > 10 ? item.id : undefined,
        item_name: item.title,
        category: item.category,
        price: parseFloat(item.price) || 0,
        description: item.description || '',
        is_active: item.status !== 'Out of Stock'
      });
    }
    await fetchFullConfig();
  };

  const updateStrategicMemory = async (lesson: string, essence: string) => {
    await supabase.from('experience_ledger').insert({
      lesson_learned: lesson,
      strategic_essence: essence,
      event_type: 'MANUAL_OPTIMIZATION'
    });
    await fetchFullConfig();
  };

  const purgeMemory = async () => {
    // 15-Day Auto-Purge Logic
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    await supabase
      .from('experience_ledger')
      .delete()
      .lt('created_at', fifteenDaysAgo.toISOString());
    
    await fetchFullConfig();
  };

  const simulateError = async () => {
    // Stress Test Logic
    await supabase.from('experience_ledger').insert({
      lesson_learned: "SYSTEM_STRESS_TEST: Simulating neural collapse. Dev Agent analyzing recovery vectors.",
      strategic_essence: "RELIANCE_PROTOCOL_v3.2",
      event_type: "STRESS_TEST_FAIL"
    });
    await fetchFullConfig();
  };

  return (
    <ConfigContext.Provider value={{ 
      config, 
      updateConfig, 
      updateAgent, 
      updateInventory, 
      updateStrategicMemory, 
      purgeMemory,
      simulateError,
      isReady, 
      refresh: fetchFullConfig 
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
