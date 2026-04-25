"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AgentState {
  name: string;
  isActive: boolean;
  icon?: string;
}

interface SystemContextType {
  enterpriseId: string | null;
  enterpriseData: any | null;
  agentsState: Record<string, AgentState>;
  updateAgent: (agentId: string, newState: Partial<AgentState>) => void;
  loading: boolean;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children, enterpriseId }: { children: React.ReactNode, enterpriseId: string | null }) {
  const [agentsState, setAgentsState] = useState<Record<string, AgentState>>({});
  const [enterpriseData, setEnterpriseData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!enterpriseId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('enterprises')
        .select(`
          *,
          agents(*)
        `)
        .eq('id', enterpriseId)
        .single();

      if (data) {
        setEnterpriseData(data);
        // Initialize agents state if needed
        const newAgentsState: Record<string, AgentState> = {};
        data.agents?.forEach((agent: any) => {
          newAgentsState[agent.id] = {
            name: agent.name,
            isActive: agent.status === 'active'
          };
        });
        setAgentsState(newAgentsState);
      }
      setLoading(false);
    }

    loadData();
  }, [enterpriseId]);

  const updateAgent = (agentId: string, newState: Partial<AgentState>) => {
    setAgentsState(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        ...newState,
        // Default values if not initialized
        name: prev[agentId]?.name || newState.name || agentId.replace(/_/g, ' '),
        isActive: prev[agentId]?.isActive ?? (newState.isActive ?? true),
      }
    }));
  };

  return (
    <SystemContext.Provider value={{ enterpriseId, enterpriseData, agentsState, updateAgent, loading }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
