# TimesAuto Backend

Node.js + TypeScript + Express + Prisma + PostgreSQL

## Project structure

```
src/
  config/           env loader
  core/
    errors/         ApiError class
    middleware/      auth, requirePermission, global error handler, upload
    utils/          logger, asyncHandler, pagination, sendResponse, fileStorage, createLog
  health/           health check route
  jobs/             articleScheduler.job.ts - scheduled article publishing
  modules/
    auth/                 register/login/me
    admins/
      admin/              admin user CRUD
      admin-log/          admin activity logs
      permission/         permission CRUD
      role/                role CRUD
    locations/
      country/ states/ district/ city/
    newCars/
      brand/ carModels/ variant/ bodyType/ attributeOption/
      color/ image/ feature/ faq/ offer/
      powertrainIce/ powertrainElectric/ video/
    articles/
      article/ articleCategory/ articleComment/
    stories/
      storyGroup/ storyItem/

    # Modeled in prisma/schema.prisma but no module yet — follow the
    # same pattern above (validation -> controller -> service -> routes)
    # to extend:
    users/            (User)
    cars-used/         (UsedCarListing, UsedCarListingImage)
    leads/             (SellCarLead, BuyNewCarLead, BuyUsedCarLead,
                        InsuranceLead, LoanLead, SoftLead,
                        PriceDropAlertLead, LeadActivity)
    reviews/            (Review, ReviewCategoryScore, ReviewImage,
                        ReviewHelpfulVote)
    mileage/            (MileageLog)
    ads/                (AdPlacement, Advertiser, AdCampaign,
                        AdImpression, AdClick)
    analytics/          (PageView, SearchLog, Notification)
    seo/                (SeoMeta, SeoRedirect, SitemapEntry)
  prisma/client.ts  Prisma client singleton
  routes/
    v1/               per-domain routers, mounted in v1.ts
  app.ts            express app (middleware, routes)
  server.ts         entrypoint
prisma/schema.prisma
```

Each built module follows: `*.validation.ts` (zod) → `*.controller.ts` (req/res) → `*.service.ts` (DB/business logic) → `*.routes.ts`, mounted in `src/routes/v1/v1.ts`.

## Setup
See terminal commands shared separately for install → env → migrate → run.
