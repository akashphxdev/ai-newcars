// src/routes/v1/stories.ts

import { Router } from 'express';
import storyGroupRoutes from '@/modules/stories/storyGroup/storyGroup.routes';
import storyItemRoutes from '@/modules/stories/storyItem/storyItem.routes';

const router = Router();

router.use('/story-groups', storyGroupRoutes);
router.use('/story-items', storyItemRoutes);

export default router;