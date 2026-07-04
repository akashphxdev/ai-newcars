# TimesAuto Backend

Node.js + TypeScript + Express + Prisma + PostgreSQL

## Project structure

```
src/
  config/           env loader
  core/
    errors/         ApiError class
    middleware/      auth, global error handler
    utils/          logger, asyncHandler, pagination
  modules/
    auth/           register/login/me
    location/       country/state/district/city
    users/          stub - follow same pattern to extend
    cars-common/    stub
    cars-new/       stub
    cars-used/      stub
    leads/          stub
    reviews/        stub
    stories/        stub
    media-stories/  stub
    mileage/        stub
    ads/            stub
    analytics/      stub
    seo/            stub
    admin/          stub
  prisma/client.ts  Prisma client singleton
  app.ts            express app (middleware, routes)
  server.ts         entrypoint
prisma/schema.prisma
```

Each module follows: `*.validation.ts` (zod) → `*.controller.ts` (req/res) → `*.service.ts` (DB/business logic) → `*.routes.ts`, mounted in `src/routes.ts`.

## Setup
See terminal commands shared separately for install → env → migrate → run.
