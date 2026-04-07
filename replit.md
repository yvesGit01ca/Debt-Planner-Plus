# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with expo-router

## Artifacts

### Debt Calendar (Expo Mobile App)
- **Path**: `artifacts/mobile/`
- **Type**: Expo React Native app
- **Features**: Debt tracking (BNPL + loans), calendar view with payment due dates, payoff simulator with extra contribution calculator, 12-month financial forecast
- **Data storage**: AsyncStorage (local, no backend)
- **Theme**: Dark (#0a0a0a) with gold (#e8c547) accents
- **Tabs**: Overview (dashboard), Calendar, Forecast
- **Key files**:
  - `context/DebtContext.tsx` — state management + persistence
  - `types/debt.ts` — TypeScript types
  - `utils/calculations.ts` — financial math utilities
  - `components/` — UI components (DebtCard, CalendarGrid, PayoffSimulator, etc.)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
