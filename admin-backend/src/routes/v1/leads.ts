// src/routes/v1/leads.ts
import { Router } from 'express';
import buyNewCarLeadRoute from '@/modules/buyLeads/newCarLeads/buyNewCarLead.routes';
import insuranceLeadRoute from '@/modules/buyLeads/insuranceLeads/insuranceLead.routes';
import priceDropAlertLeadRoute from '@/modules/buyLeads/priceDropAlerts/priceDropAlertLead.routes';
import softLeadRoute from '@/modules/buyLeads/softLeads/softLead.routes';
import loanLeadRoute from '@/modules/buyLeads/loanLeads/loanLead.routes';
import launchNotifyLeadRoute from '@/modules/buyLeads/launchNotify/launchNotifyLead.routes';

const router = Router();

router.use('/buy/new-cars', buyNewCarLeadRoute);
router.use('/buy/insurance', insuranceLeadRoute);
router.use('/buy/price-drop', priceDropAlertLeadRoute);
router.use('/buy/soft', softLeadRoute);
router.use('/buy/loan', loanLeadRoute);
router.use('/buy/launch-notify', launchNotifyLeadRoute);

export default router;
