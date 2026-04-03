# Vidzai Intelligence — React Intelligence Dashboard

A modern React application built with Vite that provides an interactive interface for exploring enterprise knowledge graphs and AI-powered insights. Built with **React 19**, **Vite 8.0**, and **Tailwind CSS 4.2**.

## 🚀 Features

- **Knowledge Graph Explorer**: Interactive Network Visualisation using `@neo4j-nvl/react`.
- **Hybrid RAG Assistant**: Context-aware AI chat integrated with graph data.
- **Forensic Intelligence Inspector**: Deep-dive into node metadata and behavioural analytics.
- **Live Metrics Dashboard**: Real-time intelligence throughput and anomaly detection.
- **Unified Search**: Hybrid search combining vector and graph retrieval.
- **Responsive Design**: Modern UI with Tailwind CSS and Framer Motion animations.

## 🛠️ Technology Stack

- **React 19**: Latest React with modern hooks and concurrent features
- **Vite 8.0**: Lightning-fast build tool and dev server
- **Tailwind CSS 4.2**: Utility-first CSS framework
- **Framer Motion 12.38**: Smooth animations and transitions
- **Neo4j NVL**: Native graph visualization library
- **Recharts 3.8**: Data visualization components
- **React Router 7.13**: Client-side routing
- **Zustand 5.0**: Lightweight state management
- **Axios 1.13**: HTTP client for API communication

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- Backend API running (see backend README)

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Starts the development server at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── chat/           # Intelligence chat components
│   │   ├── dashboard/      # Analytics and metrics
│   │   ├── graph/          # Graph visualization
│   │   ├── search/         # Search and investigation
│   │   ├── sidebar/        # Context panels
│   │   └── ui/             # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── services/           # API client and utilities
│   └── store/              # Zustand state management
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

## 🔧 Configuration

The frontend connects to the backend API. Make sure the backend is running and accessible. The API base URL can be configured in `src/services/apiClient.js`.

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for type safety (types are in devDependencies)
3. Test components thoroughly
4. Follow React best practices

## 📚 Related Documentation

- [Backend API Documentation](../backend/README.md)
- [Main Project README](../README.md)

---
*© 2026 Vidzai Enterprise | Advanced Forensic Intelligence*
