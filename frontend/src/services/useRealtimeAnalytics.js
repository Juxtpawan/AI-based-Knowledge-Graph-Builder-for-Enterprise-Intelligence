import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from './apiClient.js';

/**
 * useRealtimeAnalytics — WebSocket-powered hook for the live dashboard.
 * 
 * Behavior:
 *  1. On mount, performs a full REST fetch for historical chart data.
 *  2. Establishes a WebSocket connection for real-time KPI & Entity updates.
 *  3. Handles auto-reconnection and state merging.
 */
export function useRealtimeAnalytics() {
  const [data, setData] = useState({
    kpis: {
      intelligenceLinks: '—',
      forensic_velocity: '—',
      anomaly_score: '—',
      neural_uptime: '—',
    },
    entityBreakdown: [],
    topCommunicators: [],
    processingInfo: {
        total: 0,
        processed: 0,
        percentage: 0
    },
    chartData: [], // Static/Historical (from REST)
    alerts: [],
    isLoading: true,
    error: null,
    isLive: false,
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // ── Initial Full Load (REST) ───────────────────────────────────────────
  const fetchInitialData = useCallback(async () => {
    try {
      const [analyticsRes, alertsRes] = await Promise.all([
        apiClient.get('/analytics'),
        apiClient.get('/alerts').catch(() => ({ data: [] })),
      ]);

      const d = analyticsRes.data;
      setData(prev => ({
        ...prev,
        kpis: {
          intelligenceLinks: d.intelligence_links.toLocaleString(),
          forensic_velocity: `${d.forensic_velocity.toFixed(1)}%`,
          anomaly_score: d.anomaly_score.toFixed(2),
          neural_uptime: d.neural_uptime,
        },
        entityBreakdown: d.entity_breakdown || [],
        topCommunicators: d.top_communicators || [],
        processingInfo: {
            total: d.data_info?.total_records || 0,
            processed: d.data_info?.processed_records || 0,
            percentage: d.data_info ? round((d.data_info.processed_records / d.data_info.total_records) * 100, 1) : 0
        },
        chartData: d.cognitive_flux_series || [],
        alerts: (alertsRes.data || []).map((a) => ({
          id: a.element_id,
          element_id: a.element_id,
          is_node: a.is_node,
          type: a.type || (a.severity?.toLowerCase() === 'critical' ? 'critical' : 'warning'),
          title: a.title,
          description: a.detail || a.category,
          time: 'Live',
        })),
        isLoading: false,
      }));
    } catch (err) {
      console.error('[useRealtime] REST fetch failed:', err);
      setData(prev => ({ ...prev, isLoading: false, error: 'Initial sync failed.' }));
    }
  }, []);

  function round(val, prec) {
      return Number(val.toFixed(prec));
  }

  // ── WebSocket Lifecycle ────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/analytics`;

    console.log(`[WS] Connecting to ${wsUrl}...`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connection established.');
      setData(prev => ({ ...prev, isLive: true }));
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'analytics_update') {
          const p = message.payload;
          setData(prev => ({
            ...prev,
            kpis: {
              intelligenceLinks: p.intelligence_links.toLocaleString(),
              forensic_velocity: `${p.forensic_velocity.toFixed(1)}%`,
              anomaly_score: p.anomaly_score.toFixed(2),
              neural_uptime: p.neural_uptime,
            },
            entityBreakdown: p.entity_breakdown || [],
            topCommunicators: p.top_communicators || [],
            processingInfo: p.processing_info || prev.processingInfo,
            alerts: p.alerts || prev.alerts,
          }));
        }
      } catch (err) {
        console.warn('[WS] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      console.warn('[WS] Connection lost. Retrying in 5s...');
      setData(prev => ({ ...prev, isLive: false }));
      reconnectTimeoutRef.current = setTimeout(connectWS, 5000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Connection error:', err);
      ws.close();
    };
  }, []);

  const removeAlert = useCallback((id) => {
    setData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.element_id !== id)
    }));
  }, []);

  useEffect(() => {
    fetchInitialData();
    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchInitialData, connectWS]);

  return { ...data, removeAlert };
}
