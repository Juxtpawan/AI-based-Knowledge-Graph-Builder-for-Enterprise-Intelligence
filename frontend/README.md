# Vidzai Frontend — Forensic Investigation Suite

The **Vidzai Frontend** is a professional-grade, high-fidelity **React** application built with **Vite**. It provides a window into the complex enterprise knowledge graph, offering interactive exploration and AI-powered investigation.

## 🚀 Key Features

### 🔍 Bloom Graphic Forensic Engine
- **Interactive High-Fidelity Canvas**: Powered by `@neo4j-nvl`, featuring real-time node highlighting and relationship pathing.
- **Probe Mode**: Contextual subgraphs centered around your search query.
- **Global Mode**: A high-density constellation view of the entire enterprise dataset.
- **Forensic Inspector (v2)**: Advanced sidebar panels with data-driven filter categories (Structural, Forensic, Temporal) and single-vector selection logic.

### 📊 Cognitive Analytics & Curation
- **Dynamic Metrics**: Real-time throughput and anomaly detection via **Recharts**.
- **Alert Fabric**: Real-time intelligence feed for forensic signals with circular branding and interactive triage.
- **Forensic Curation Sidebar**: High-density investigative forms for validating and flagging intelligence.
- **Thought Stepper**: Transparent UI showing the AI's step-by-step reasoning via **Chain-of-Thought**.
- **Stateful Intelligence**: Unified state management using **Zustand** ensuring synchronized selection across all views.
- **Responsive Layout**: Cross-breakpoint optimized interface with mobile-safe sidebar logic and scrollable filter panels.
- **Glassmorphism UI**: Beautiful, modern design using **Tailwind CSS 4.x** and **Framer Motion 12.x**.

## 🛠️ Technology Stack
- **Framework**: React 19 (Concurrent Mode)
- **Tooling**: Vite 8, ESLint (Modern Config), React Router 7
- **Styling**: Tailwind CSS 4.2 (Glassmorphism), Framer Motion 12.38, Lucide React
- **Visuals**: `@neo4j-nvl/react` 1.10, Recharts 3.8
- **State & Auth**: Zustand 5.0, Google OAuth 2.0

## 📁 Directory Structure
- **`src/components/graph/`**: All Bloom graph logic, canvas wrapper, and terminal.
- **`src/components/chat/`**: Intelligence assistant interface and thought stepping.
- **`src/components/dashboard/`**: Analytics metrics and chart fabric.
- **`src/pages/`**: Main views including NetworkView, TopicExplorer, and RagChat.
- **`src/store/`**: Atomic state management (`useIntelStore`).

## 🚀 Setting Up the Development Client

### 1. Prerequisites
- Node.js 18+
- Backend API running (see backend README)

### 2. Installation
```bash
npm install
```

### 3. Development
```bash
npm run dev
```
Starts the development server on `http://localhost:5173`.

### 4. Production Build
```bash
npm run build
```

---

## ☁️ Deployment
The frontend is deployed as a **Static Site** on **Render**. The build process is automated via the `render.yaml` blueprint, which runs `npm install && npm run build` and serves the `dist/` directory.
