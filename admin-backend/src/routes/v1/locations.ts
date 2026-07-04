// src/routes/v1/locations.ts
import { Router } from 'express';
import countryRoute from '@/modules/locations/country/country.routes';
import stateRoute from '@/modules/locations/states/state.routes';
import DistrictRoute from '@/modules/locations/district/district.routes'
import CityRoute from '@/modules/locations/city/city.routes'

const router = Router();

router.use('/countries', countryRoute);
router.use('/states', stateRoute);
router.use('/districts', DistrictRoute)
router.use('/cities', CityRoute)


export default router;