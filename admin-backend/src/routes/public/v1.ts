// src/routes/public/v1.ts
//
// Public, unauthenticated API for the website — mirrors routes/v1/v1.ts's
// aggregator pattern, but every module mounted here lives under
// src/modules/public/ and has no auth/permission middleware.
import { Router } from 'express';
import HomeRoutes from './home';

const router = Router();

router.use('/home', HomeRoutes);

export default router;
