import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../../services/apiClient';

const POLLING_INTERVAL_MS = 30_000; // 30 seconds for pulse

/**
 * useAnalytics — Custom hook for the Overview dashboard.
 *
 * Behavior:
 *  1. On mount, fetches the full `/analytics` payload (KPIs + chart data).
 *  2. Every 30 seconds, polls `/analytics/pulse` to update the 4 KPI cards
 *     without re-fetching the heavy chart data.
 *
 * Returns: { kpis, chartData, entityBreakdown, topCommunicators, alerts, isLoading, error }
 */
export function useAnalytics() {
  const [kpis, setKpis] = useState({
    intelligenceLinks: '—',
    forensicVelocity: '—',
    anomalyScore: '—',
    neuralUptime: '—',
    graphDensity: '—',
    flaggedNodes: 0,
    flaggedRels: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [entityBreakdown, setEntityBreakdown] = useState([]);
  const [topCommunicators, setTopCommunicators] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const pollingRef = useRef(null);

  // ── Full load from /analytics ──────────────────────────────────────────────
  const fetchFullAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, alertsRes] = await Promise.all([
        apiClient.get('/analytics'),
        apiClient.get('/alerts').catch(() => ({ data: [] })),
      ]);

      const d = analyticsRes.data;

      setKpis({
        intelligenceLinks: d.intelligence_links.toLocaleString(),
        forensicVelocity: `${d.forensic_velocity.toFixed(1)}%`,
        anomalyScore: d.anomaly_score.toFixed(2),
        neuralUptime: d.neural_uptime,
        graphDensity: (d.graph_density * 100).toFixed(4) + '%',
        flaggedNodes: d.flagged_nodes,
        flaggedRels: d.flagged_rels,
      });

      // Cognitive Flux chart data comes from real Enron date aggregation
      setChartData(d.cognitive_flux_series || []);
      setEntityBreakdown(d.entity_breakdown || []);
      setTopCommunicators(d.top_communicators || []);

      // Map alerts to display format
      setAlerts(
        (alertsRes.data || []).map((a, i) => ({
          id: i,
          type: a.severity?.toLowerCase() === 'critical' ? 'critical' : 'warning',
          title: a.title,
          description: a.detail || a.category,
          time: 'Live',
        }))
      );
      setError(null);
    } catch (err) {
      console.error('[useAnalytics] Full fetch failed:', err);
      setError('Analytics sync failed. Check backend connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Lightweight pulse poll from /analytics/pulse ───────────────────────────
  const fetchPulse = useCallback(async () => {
    try {
      const res = await apiClient.get('/analytics/pulse');
      const d = res.data;
      setKpis(prev => ({
        ...prev,
        intelligenceLinks: d.intelligence_links.toLocaleString(),
        forensicVelocity: `${d.forensic_velocity.toFixed(1)}%`,
        anomalyScore: d.anomaly_score.toFixed(2),
        neuralUptime: d.neural_uptime,
        graphDensity: (d.graph_density * 100).toFixed(4) + '%',
        flaggedNodes: d.flagged_nodes,
        flaggedRels: d.flagged_rels,
      }));
    } catch (err) {
      console.warn('[useAnalytics] Pulse poll failed:', err);
      // Non-fatal: don't set error state for a failed pulse
    }
  }, []);

  useEffect(() => {
    fetchFullAnalytics();

    // Start 30-second polling for live KPI updates
    pollingRef.current = setInterval(fetchPulse, POLLING_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchFullAnalytics, fetchPulse]);

  return { kpis, chartData, entityBreakdown, topCommunicators, alerts, isLoading, error };
}
