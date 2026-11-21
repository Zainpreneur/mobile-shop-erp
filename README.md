# MobileShop Business Software (Next.js)

A full-stack Next.js App Router conversion of the original React/Vite + Express mobile shop manager. Inventory, point of sale, repairs, customers, suppliers, staff accounts and dashboards all run in one Next.js application backed by Prisma + SQLite.

## Stack

- Next.js 16 (App Router, Route Handlers, React 19)
- TypeScript, Tailwind CSS v4, Recharts
- Prisma 5 + SQLite
- JWT auth stored in an httpOnly cookie
- Zod validation on API routes

## Setup

```bash
npm install
cp .env.example .env
npm run setup     # prisma generate + db push + seed
npm run dev
```

Open <http://localhost:3000>.

Demo logins:

- Admin: `admin@mobileshop.com` / `admin123`
- Staff: `staff@mobileshop.com` / `staff123`

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server (port 3000 or `$PORT`). |
| `npm run build` | Generate the Prisma client and build for production. |
| `npm run start` | Start the production server. |
| `npm run db:generate` | Regenerate the Prisma client. |
| `npm run db:migrate` | Push the Prisma schema to SQLite. |
| `npm run db:seed` | Seed demo users, products, customers, sales and repairs. |
| `npm run setup` | Generate, migrate and seed in one command. |

## Architecture

- `src/app/(app)/...` — authenticated App Router pages (dashboard, inventory, POS, repairs, customers, suppliers, users).
- `src/app/api/...` — Route Handlers replacing the former Express routes, mounted under the same `/api` paths.
- `src/components/` — client-side shell, auth provider, toast provider, icons and reusable UI primitives.
- `src/lib/` — Prisma singleton, auth helpers, HTTP error handling, API client and shared types.
- `prisma/` — SQLite schema and TypeScript seed script.

Auth is enforced in Route Handlers with `requireUser` / `requireAdmin`. Login sets an httpOnly cookie; the client API helper sends it with every same-origin request. The original `backend/` and `frontend/` directories are retained for reference only and are not used by the Next.js app.
