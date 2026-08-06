// src/routes/public/leads.ts
import { Router } from 'express';
import leadOtpRoute from '@/modules/public/leads/leadOtp.routes';
import newCarLeadRoute from '@/modules/public/leads/newCarLead/newCarLead.public.routes';
import insuranceLeadRoute from '@/modules/public/leads/insuranceLead/insuranceLead.public.routes';
import priceDropAlertRoute from '@/modules/public/leads/priceDropAlert/priceDropAlert.public.routes';
import softLeadRoute from '@/modules/public/leads/softLead/softLead.public.routes';
import loanLeadRoute from '@/modules/public/leads/loanLead/loanLead.public.routes';
import launchNotifyRoute from '@/modules/public/leads/launchNotify/launchNotify.public.routes';

const router = Router();

router.use('/otp', leadOtpRoute);
router.use('/buy/new-cars', newCarLeadRoute);
router.use('/buy/insurance', insuranceLeadRoute);
router.use('/buy/price-drop', priceDropAlertRoute);
router.use('/buy/soft', softLeadRoute);
router.use('/buy/loan', loanLeadRoute);
router.use('/buy/launch-notify', launchNotifyRoute);

export default router;
