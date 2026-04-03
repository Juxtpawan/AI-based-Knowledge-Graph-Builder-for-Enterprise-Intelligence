# Vidzai Frontend — Intelligence Visualization & Forensics Dashboard

The **Vidzai Frontend** is a professional-grade, high-fidelity **React** application built with **Vite**. It provides a window into the complex enterprise knowledge graph, offering interactive exploration and AI-powered investigation.

## 🚀 Key Features

### 🔍 Bloom Graphic Forensic Engine
- **Interactive High-Fidelity Canvas**: Powered by `@neo4j-nvl`, featuring real-time node highlighting and relationship pathing.
- **Probe Mode**: Contextual subgraphs centered around your search query.
- **Global Mode**: A high-density constellation view of the entire enterprise dataset.
- **Forensic Inspector**: Sidebar panels for entity identity, behavioral forensics, and deep metadata deep-dives.

### 📊 Cognitive Analytics
- **Dynamic Metrics**: Real-time throughput and anomaly detection via **Recharts**.
- **Stateful Intelligence**: Unified state management using **Zustand** ensuring synchronised selection across all views.
- **Glassmorphism UI**: Beautiful, modern design using **Tailwind CSS 4** and **Framer Motion 12**.

## 🛠️ Technology Stack
- **Framework**: React 19 (Concurrent Mode)
- **Tooling**: Vite 8, ESLint (Modern Config)
- **Styling**: Tailwind CSS 4, Framer Motion
- **Visuals**: `@neo4j-nvl/react`, Recharts
- **State**: Zustand (Custom Store)

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
