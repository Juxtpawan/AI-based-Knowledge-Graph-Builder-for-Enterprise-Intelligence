import { create } from 'zustand';

/**
 * useIntelStore - Atomic State for Vidzai Enterprise
 * Synchronizes the Graph Canvas, Selection, and AI Intelligence Rail.
 */
export const useIntelStore = create((set) => ({
  selectedElement: null,
  activeSearchPhrase: '',
  isIntelligenceRailOpen: true,
  graphStats: { nodes: 0, edges: 0 },
  customGraphData: null,
  evidenceBag: [],
  investigationPath: [],
  cypherHistory: [],
  
  // Actions
  setSelectedElement: (el) => set({ selectedElement: el }),
  setActiveSearchPhrase: (phrase) => set({ activeSearchPhrase: phrase, customGraphData: null }),
  setIsIntelligenceRailOpen: (isOpen) => set({ isIntelligenceRailOpen: isOpen }),
  setGraphStats: (stats) => set({ graphStats: stats }),
  setCustomGraphData: (data) => set({ customGraphData: data }),
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
    // If the step is already in the path, slice the path to that step (breadcrumb behavior)
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
