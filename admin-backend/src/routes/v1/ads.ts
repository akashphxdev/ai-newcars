// src/routes/v1/ads.ts
import { Router } from 'express';
import advertiserRoute from '@/modules/ads/advertiser/advertiser.routes';
import adPlacementRoute from '@/modules/ads/adPlacement/adPlacement.routes';
import adCampaignRoute from '@/modules/ads/adCampaign/adCampaign.routes';
import adImpressionRoute from '@/modules/ads/adImpression/adImpression.routes';
import adClickRoute from '@/modules/ads/adClick/adClick.routes';

const router = Router();

router.use('/advertisers', advertiserRoute);
router.use('/placements', adPlacementRoute);
router.use('/campaigns', adCampaignRoute);
router.use('/impressions', adImpressionRoute);
router.use('/clicks', adClickRoute);

export default router;