# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Development Server
```bash
npm run dev
```
Starts Next.js development server with Turbopack on http://localhost:3000

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint       # Check for linting issues
npm run lint:fix   # Automatically fix linting issues
```

### Type Checking
TypeScript is configured with strict mode. Run the build command to type check:
```bash
npm run build
```

## Architecture Overview

### Frontend Stack
- **Next.js 15** with App Router architecture
- **TypeScript** with strict mode enabled
- **Tailwind CSS** for styling
- **Starknet React** for blockchain integration

### Core Application Structure

#### Entry Points
- `src/app/page.tsx` - Main application entry, handles music playback and routing logic
- `src/app/layout.tsx` - Root layout with custom pixel font configuration
- `src/screens/canvas.tsx` - Main canvas screen managing game state, world data, and WebSocket connections

#### Canvas System
The application is a competitive pixel art canvas on Starknet:
- **Multi-world support**: Base world and surrounding worlds system
- **Real-time updates**: WebSocket integration for live canvas updates
- **Pixel placement**: Time-based pixel placement with cooldown system
- **Staging system**: Preview pixels before committing to blockchain

#### Starknet Integration
- `src/components/StarknetProvider.tsx` - Configures wallet connectors (Argent, Braavos, Controller)
- `src/contract/calls.tsx` - Smart contract interaction functions
- Session policies defined for canvas operations (place_pixel, create_canvas, etc.)

#### API Layer
- `src/api/api.tsx` - Core API utilities and backend/WebSocket URLs
- `src/api/canvas.tsx` - Canvas data fetching
- `src/api/worlds.tsx` - World management APIs
- `src/api/stencils.tsx` - Stencil system APIs
- `src/api/agent.tsx` - AI agent integration

#### Component Organization
- `src/components/canvas/` - Canvas rendering and control components
- `src/components/tabs/` - Tab panels for different features (account, worlds, stencils, leaderboard)
- `src/components/footer/` - Footer with controls and AI agent interface
- `src/components/utils/` - Utility components (sounds, pagination)

### Environment Variables
Key configuration variables:
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (default: http://localhost:8080)
- `NEXT_PUBLIC_WEBSOCKET_URL` - WebSocket server URL (default: ws://localhost:8083)
- `NEXT_PUBLIC_CANVAS_CONTRACT_ADDRESS` - Starknet contract address
- `NEXT_PUBLIC_CHAIN_ID` - Network selection (SN_SEPOLIA or SN_MAIN)
- `NEXT_PUBLIC_BASE_WORLD_ID` - Default world ID (default: 13)
- `NEXT_PUBLIC_UPLOAD_ENABLED` - Enable stencil upload feature (set to "true" to enable)
- `NEXT_PUBLIC_DEV_MODE` - Enable dev mode for testing without authentication (set to "true" to enable)

### Development Mode
For local development, create a `.env.local` file with:
```
NEXT_PUBLIC_UPLOAD_ENABLED=true
NEXT_PUBLIC_DEV_MODE=true
```
This enables stencil creation without authentication, useful for testing when you cannot log in from localhost.

### Path Aliases
- `@/*` maps to `./src/*` for cleaner imports