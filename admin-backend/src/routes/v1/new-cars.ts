// src/routes/v1/locations.ts
import { Router } from 'express';
import brandRoute from '@/modules/newCars/brand/brand.routes';
import carModelRoute from '@/modules/newCars/carModels/carModel.routes';
import variantRoute from '@/modules/newCars/variant/variant.routes'
import powertrainElectricRoute from '@/modules/newCars/powertrainElectric/powertrainElectric.routes'
import powertrainice from '@/modules/newCars/powertrainIce/powertrainIce.routes'
import colorRoute from '@/modules/newCars/color/color.routes'
import imageRoute from '@/modules/newCars/image/image.routes'
import featureRoute from '@/modules/newCars/feature/feature.routes'
import faqRoute from '@/modules/newCars/faq/faq.routes'
import offerRoute from '@/modules/newCars/offer/offer.routes'
import videoRoute from '@/modules/newCars/video/video.routes'


const router = Router();

router.use('/brands', brandRoute);
router.use('/car-models', carModelRoute);
router.use('/variants', variantRoute)
router.use('/powertrains/electric', powertrainElectricRoute)
router.use('/powertrains/ice', powertrainice)
router.use('/colors', colorRoute)
router.use('/images', imageRoute)
router.use('/features', featureRoute )
router.use('/faqs', faqRoute )
router.use('/offers', offerRoute )
router.use('/videos', videoRoute )

export default router;