import { create } from 'zustand';
import { kgService } from '../services/apiClient';

/**
 * useIntelStore - Atomic State for Vidzai Enterprise
 * Synchronizes the Graph Canvas, Selection, and AI Intelligence Rail.
 */
export const useIntelStore = create((set, get) => ({
  selectedElement: null,
  activeSearchPhrase: '',
  isIntelligenceRailOpen: true,
  graphStats: { nodes: 0, edges: 0 },
  customGraphData: null,
  evidenceBag: [],
  investigationPath: [],
  cypherHistory: [],
  cypherQuery: 'MATCH (n) RETURN n LIMIT 25',
  isCypherLoading: false,
  cypherError: null,
  isExpanding: false,
  viewMode: 'probe', // 'probe' or 'global'
  
  // Auth State
  user: null,
  isAuthenticated: localStorage.getItem('vidzai_auth') === 'true',
  
  // Actions
  login: (userData) => {
    localStorage.setItem('vidzai_auth', 'true');
    set({ user: userData, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('vidzai_auth');
    set({ user: null, isAuthenticated: false });
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedElement: (el) => set({ selectedElement: el }),
  setActiveSearchPhrase: (phrase) => set({ activeSearchPhrase: phrase, customGraphData: null }),
  setIsIntelligenceRailOpen: (isOpen) => set({ isIntelligenceRailOpen: isOpen }),
  setGraphStats: (stats) => set({ graphStats: stats }),
  setCustomGraphData: (data) => set({ customGraphData: data }),
  setCypherQuery: (query) => set({ cypherQuery: query }),
  setCypherError: (error) => set({ cypherError: error }),
  
  // Cypher Execution Engine
  executeCypher: async (queryOverride) => {
    const { cypherQuery, addToCypherHistory } = get();
    const queryToRun = queryOverride || cypherQuery;
    
    set({ isCypherLoading: true, cypherError: null });
    try {
      const result = await kgService.runCypher(queryToRun);
      set({ customGraphData: result });
      addToCypherHistory(queryToRun);
      if (!queryOverride) set({ cypherQuery: queryToRun });
      return result;
    } catch (err) {
      set({ cypherError: err.message || "Query failed" });
      throw err;
    } finally {
      set({ isCypherLoading: false });
    }
  },
  
  // High-Fidelity Node Insight
  fetchNodeDetails: async (nodeId) => {
    try {
      const details = await kgService.getNodeDetails(nodeId);
      // Synchronize selection with full details without losing references
      set({ selectedElement: details });
      return details;
    } catch (err) {
      console.error("Store Detail Error:", err);
    }
  },
  
  // Bloom Expansion Engine
  expandNode: async (nodeId) => {
    set({ isExpanding: true });
    try {
      const neighbors = await kgService.getNeighbors(nodeId);
      const currentData = get().customGraphData || { nodes: [], relationships: [] };
      
      const existingNodeIds = new Set(currentData.nodes.map(n => n.id));
      const existingRelIds = new Set(currentData.relationships.map(r => r.id));
      
      const newNodes = neighbors.nodes.filter(n => !existingNodeIds.has(n.id));
      const newRels = neighbors.relationships.filter(r => !existingRelIds.has(r.id));
      
      const updatedData = {
        nodes: [...currentData.nodes, ...newNodes],
        relationships: [...currentData.relationships, ...newRels]
      };
      
      set({ customGraphData: updatedData });
      return updatedData;
    } catch (err) {
      console.error("Store Expansion Error:", err);
    } finally {
      set({ isExpanding: false });
    }
  },

  addToCypherHistory: (query) => set((state) => ({
    cypherHistory: [query, ...state.cypherHistory.filter(h => h !== query)].slice(0, 50)
  })),

  // Forensic Actions
  pinNode: (node) => set((state) => ({
    evidenceBag: [...state.evidenceBag.filter(n => n.id !== node.id), node]
  })),
  unpinNode: (nodeId) => set((state) => ({
    evidenceBag: state.evidenceBag.filter(n => n.id !== nodeId)
  })),
  addToPath: (step) => set((state) => {
    const existingIndex = state.investigationPath.findIndex(s => s.id === step.id);
    if (existingIndex !== -1) {
        return { investigationPath: state.investigationPath.slice(0, existingIndex + 1) };
    }
    return { investigationPath: [...state.investigationPath, step].slice(-8) };
  }),
  clearPath: () => set({ investigationPath: [] }),
  
  // Clear Investigation
  clearInvestigation: () => set({ 
    selectedElement: null, 
    activeSearchPhrase: '',
    graphStats: { nodes: 0, edges: 0 },
    customGraphData: null,
    investigationPath: []
  })
}));
