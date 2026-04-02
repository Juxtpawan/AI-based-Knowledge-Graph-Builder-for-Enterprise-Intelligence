"""
Pure forensic metric computation functions.

All functions here are stateless, dependency-free, and fully unit-testable.
They encode the scientific formulas used to compute the Overview dashboard KPIs.

Formulas sourced from:
  - Graph Theory (Baeldung, StackExchange) → graph density
  - Forensic temporal analysis research   → forensic velocity
  - Industry SIEM practices (Memgraph)    → anomaly score
"""
import time


def format_uptime(start_time: float) -> str:
    """
    Compute a human-readable server uptime string.
    Example: "2d 4h 31m" or "45m 12s"
    """
    elapsed = int(time.time() - start_time)
    days, remainder = divmod(elapsed, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, seconds = divmod(remainder, 60)

    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m {seconds}s"


def compute_graph_density(node_count: int, rel_count: int) -> float:
    """
    Graph Density for a directed graph:
        D = E / (V × (V − 1))

    Where E = number of edges (relationships) and V = number of vertices (nodes).
    Range: 0.0 (empty graph) → 1.0 (fully-connected graph).

    Reference: Graph Theory fundamentals — Baeldung, StackExchange.
    """
    if node_count < 2:
        return 0.0
    return round(rel_count / (node_count * (node_count - 1)), 6)


def compute_forensic_velocity(node_count: int, rel_count: int) -> float:
    """
    Forensic Velocity = Average Node Degree, normalised to 0–100%.

        avg_degree = (2 × E) / V        (undirected interpretation)
        velocity   = min(avg_degree / 20, 1.0) × 100

    Normalisation anchor: an actor communicating with ~20 unique peers = 100%.
    This threshold is calibrated against Enron corpus baseline behaviour.

    Reference: Graph theory degree analysis + forensic temporal research.
    """
    if node_count == 0:
        return 0.0
    avg_degree = (2 * rel_count) / node_count
    return round(min(avg_degree / 20.0, 1.0) * 100.0, 1)


def compute_anomaly_score(flagged_count: int, total_count: int) -> float:
    """
    Anomaly Score = Risk Saturation Ratio, scaled to 0–10.

        S = (flagged / total_elements) × 10

    Interpretation:
      0.0  = completely clean graph (no flagged elements)
      10.0 = 100% of graph elements are flagged (maximum risk)
      > 1.0 = investigation warranted

    Reference: Forensic ensemble scoring (Memgraph, industry SIEM practices).
    """
    if total_count == 0:
        return 0.0
    return round((flagged_count / total_count) * 10.0, 2)
