// src/routes/v1/leads.ts
import { Router } from 'express';
import buyNewCarLeadRoute from '@/modules/buyLeads/newCarLeads/buyNewCarLead.routes';
import insuranceLeadRoute from '@/modules/buyLeads/insuranceLeads/insuranceLead.routes';
import priceDropAlertLeadRoute from '@/modules/buyLeads/priceDropAlerts/priceDropAlertLead.routes';

const router = Router();

router.use('/buy/new-cars', buyNewCarLeadRoute);
router.use('/buy/insurance', insuranceLeadRoute);
router.use('/buy/price-drop', priceDropAlertLeadRoute);

export default router;
