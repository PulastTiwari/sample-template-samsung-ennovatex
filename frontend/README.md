# Sentinel-QoS AI Network Orchestrator

A cutting-edge AI-driven Quality of Service (QoS) orchestrator that intelligently classifies network traffic flows and applies optimal QoS policies using a two-stage AI classification system.

## Features

### AI-Powered Classification

- **Sentry Engine**: Fast LightGBM-based classification for common traffic patterns
  -- **Vanguard Engine**: analysis for complex flows and detailed explanations
- **Hybrid Architecture**: Optimizes both speed and accuracy for real-time network management

### Real-Time Monitoring

- Live traffic flow monitoring with sortable, filterable data tables
- Real-time AI classification logs with engine attribution
- Interactive flow investigation with detailed analysis panels
- Comprehensive metrics dashboard with QoS policy tracking

### Intelligent Policy Management

- AI-generated policy suggestions with community voting
- Automated QoS policy application based on traffic classification
- DSCP and traffic class assignment with visual priority indicators
- Policy approval workflow with optimistic UI updates

### Model Management

- Feature importance analysis and model performance metrics
- Step-by-step retraining instructions with best practices
- Model version history and rollback capabilities
- System health monitoring and recommendations

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React hooks with SWR for data fetching
- **Styling**: Custom design system with semantic color tokens
- **Charts**: Recharts for data visualization
- **Backend API**: FastAPI (Python) - separate repository

## Prerequisites

- Node.js 18+
- npm or yarn package manager
- Sentinel-QoS backend API running on `localhost:8000`

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd sentinel-qos-dashboard
npm install
\`\`\`

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

\`\`\`env

# API Configuration

NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Development settings

NEXT_PUBLIC_DEV_MODE=true
\`\`\`

### 3. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`

### 4. Backend Setup

Ensure the Sentinel-QoS backend is running:

\`\`\`bash

# In your backend directory

python orchestrator.py
\`\`\`

The backend should be accessible at `http://localhost:8000`

## Application Structure

### Pages

- **Dashboard** (`/`) - Main overview with metrics, AI status, and recent activity
- **Traffic Monitor** (`/traffic`) - Detailed flow monitoring with investigation tools
- **AI Classification** (`/classify`) - Manual classification testing and engine performance
- **Suggestions** (`/suggestions`) - Policy recommendation management and voting
- **Model Management** (`/model`) - AI model analysis, training, and version control
- **Investigations** (`/investigations`) - Flow anomaly tracking and resolution

### Key Components

- **Live Traffic Table** - Real-time sortable flow monitoring
  -- **Status Indicators** - Sentry/Vanguard engine health monitoring
- **Suggestion Cards** - Interactive policy approval/denial interface
- **Metrics Cards** - QoS priority visualization with color coding
- **Classification Log** - Real-time AI decision tracking with explanations

## Design System

### Color Palette

- **Primary**: Deep tech background (#1f2937) for professional appearance
- **Accent**: Purple (#8b5cf6) for interactive elements and AI highlights
- **Neutrals**: White, grays for text and subtle backgrounds
- **Status Colors**: Green (approved), Red (denied/errors), Yellow (pending), Blue (info)

### Typography

- **Headings**: Playfair Display for elegant, attention-grabbing titles
- **Body**: Source Sans Pro for optimal readability
- **Code/Data**: Geist Mono for technical information and metrics

## Configuration

### API Endpoints

The application connects to these backend endpoints:

- `GET /status` - System status and real-time data
- `POST /classify` - Manual flow classification
- `GET /suggestions` - Policy suggestions list
- `POST /suggestions/{id}/approve` - Approve suggestion
- `POST /suggestions/{id}/deny` - Deny suggestion

### Environment Variables

| Variable               | Description                 | Default                 |
| ---------------------- | --------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API base URL        | `http://localhost:8000` |
| `NEXT_PUBLIC_DEV_MODE` | Enable development features | `false`                 |

## Deployment

### Production Build

\`\`\`

## Development

### Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package\*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Development

### Code Structure

\`\`\`
src/
├── app/ # Next.js app router pages
├── components/  
│ ├── dashboard/ # Dashboard-specific components
│ ├── traffic/ # Traffic monitoring components
│ ├── classification/ # AI classification components
│ ├── suggestions/ # Policy suggestion components
│ ├── model/ # Model management components
│ ├── layout/ # Layout and navigation
│ └── ui/ # Reusable UI components
├── hooks/ # Custom React hooks
├── lib/ # Utilities and API client
└── types/ # TypeScript type definitions
\`\`\`

### Key Hooks

- `useLiveStatus()` - Real-time system status polling
- `useClassification()` - Manual classification interface
- `useSuggestions()` - Policy suggestion management

### API Client

The `lib/api.ts` module provides typed API methods:

\`\`\`typescript
import { api } from '@/lib/api'

// Fetch system status
const status = await api.fetchStatus()

// Classify a flow
const result = await api.postClassify(flowFeatures)

// Manage suggestions
const suggestions = await api.listSuggestions()
await api.approveSuggestion(suggestionId)
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

1. Check the [Issues](../../issues) page for known problems
2. Create a new issue with detailed information
3. Contact the development team

## Roadmap

- [ ] Real-time WebSocket integration for live updates
- [ ] Advanced analytics and reporting dashboard
- [ ] Multi-tenant support for enterprise deployments
- [ ] Mobile-responsive optimizations
- [ ] Integration with popular network monitoring tools
- [ ] Machine learning model A/B testing framework

---

**Sentinel-QoS** - Intelligent Network Orchestration for the Modern Enterprise
