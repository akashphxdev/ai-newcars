// src/routes/public/leads.ts
import { Router } from 'express';
import leadOtpRoute from '@/modules/public/leads/leadOtp.routes';
import newCarLeadRoute from '@/modules/public/leads/newCarLead/newCarLead.public.routes';
import insuranceLeadRoute from '@/modules/public/leads/insuranceLead/insuranceLead.public.routes';
import priceDropAlertRoute from '@/modules/public/leads/priceDropAlert/priceDropAlert.public.routes';

const router = Router();

router.use('/otp', leadOtpRoute);
router.use('/buy/new-cars', newCarLeadRoute);
router.use('/buy/insurance', insuranceLeadRoute);
router.use('/buy/price-drop', priceDropAlertRoute);

export default router;
