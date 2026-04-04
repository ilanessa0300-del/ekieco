# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the EkiEco waste exchange marketplace for the city of Ekibastuz, Kazakhstan.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/ekieco)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Map library**: Leaflet.js (OpenStreetMap tiles)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Animations**: Framer Motion

## Application: EkiEco — Цифровая биржа отходов Экибастуза

### Features
- Phone-based auth with simulated SMS code verification
- Interactive Leaflet map centered on Ekibastuz (51.7237, 75.3229)
- Green markers = sale listings, Orange markers = purchase requests
- Two-tab listings feed: "Продают" / "Покупают"
- Create sale listings with map location picker
- Create purchase requests
- VIP listings with "ТОП" badge
- Personal account with activity history
- Stats bar showing totals and top waste type
- Monetization: VIP listings, ad banner, 5% commission note

### Routes
- `/` — Home with map + listings feed
- `/auth` — Phone authentication
- `/profile` — Personal account
- `/listings/new` — Create sale listing
- `/requests/new` — Create purchase request

### Waste Types
масло, шины, пластик, металл, другое

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/ekieco run dev` — run frontend locally

## Map Center
Ekibastuz, Kazakhstan: 51.7237, 75.3229

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
