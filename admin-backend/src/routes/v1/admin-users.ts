// src/routes/v1/admins.ts
import { Router } from 'express';
import adminRoutes from '@/modules/admins/admin/admin.routes';
import roleRoutes from '@/modules/admins/role/role.routes';
import permissionRoutes from '@/modules/admins/permission/permission.routes';
import adminLogRoutes from '@/modules/admins/admin-log/admin-log.routes';

const router = Router();

router.use('/admins', adminRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/admin-logs', adminLogRoutes);

export default router;