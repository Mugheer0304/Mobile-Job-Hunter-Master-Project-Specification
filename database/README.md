# Database

- **Authoritative schema:** [`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)
- **Migrations:** generated via `npx prisma migrate dev` (stored in `../backend/prisma/migrations/`)
- **`schema.sql`:** human-readable reference DDL (kept in sync manually)
- **`seeders/seed.sql`:** reference SQL seed data (runnable seeder is `../backend/prisma/seed.ts`)

## Local setup

```bash
docker compose up -d postgres redis   # or your own Postgres
cd ../backend
npm run prisma:migrate                # create tables
npm run db:seed                       # load demo data
```
