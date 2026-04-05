import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resiliency Interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('Neural Link Timeout: The backend is taking too long to respond.');
    }
    return Promise.reject(error);
  }
);

export const kgService = {
  // Module 4: Analytics
  getMetrics: async () => {
    try {
      const response = await apiClient.get('/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Module 1: RAG Chat
  queryRag: async (question) => {
    try {
      const response = await apiClient.post('/query', { query: question });
      return response.data;
    } catch (error) {
      console.error('Error querying Hybrid RAG agent:', error);
      throw error;
    }
  },

  // NEW: Direct Cypher Execution
  runCypher: async (query) => {
    try {
      const response = await apiClient.post('/cypher', { query });
      return response.data;
    } catch (error) {
      console.error('Error executing Cypher query:', error);
      throw error;
    }
  },

  getAlerts: async () => {
    try {
      const res = await apiClient.get('/alerts');
      return res.data;
    } catch (err) {
      console.error('Alerts Error:', err);
      return [];
    }
  },

  curateElement: async (data) => {
    const res = await apiClient.post('/curate', data);
    return res.data;
  },

  pruneElement: async (id, isNode = true) => {
    const res = await apiClient.delete(`/elements/${id}?is_node=${isNode}`);
    return res.data;
  },

  // Module 2 & 3: Graph Discovery Services
  getGraphData: async (params = { limit: 150 }) => {
    try {
      const response = await apiClient.get('/graph', {
        params,
        timeout: 90000
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching initial graph:', error);
      return { nodes: [], relationships: [] };
    }
  },

  // NEW: Neighbor Expansion (incremental exploration)
  getNeighbors: async (elementId) => {
    try {
      const response = await apiClient.get(`/node/${encodeURIComponent(elementId)}/neighbors`);
      return response.data;
    } catch (error) {
      console.error('Error expanding node:', error);
      return { nodes: [], relationships: [] };
    }
  },

  // NEW: Search suggestions
  getSuggestions: async (query) => {
    try {
      const response = await apiClient.get('/search/suggest', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return { suggestions: [] };
    }
  },

  getNodePulse: async (nodeId) => {
    try {
      const response = await apiClient.get(`/node/${encodeURIComponent(nodeId)}/pulse`);
      return response.data;
    } catch (error) {
      console.error('Error fetching node pulse:', error);
      throw error;
    }
  },
  
  // NEW: Detail fetch for inspector
  getNodeDetails: async (elementId) => {
    try {
      const response = await apiClient.get(`/node/${encodeURIComponent(elementId)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching full node details:', error);
      throw error;
    }
  }
};

export default apiClient;
