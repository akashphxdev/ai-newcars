// src/routes/v1/articles.ts
import { Router } from 'express';
import articleCategoryRoute from '@/modules/articles/articleCategory/articleCategory.routes';
import articleRoute from '@/modules/articles/article/article.routes';

const router = Router();

router.use('/categories', articleCategoryRoute);
router.use('/', articleRoute);

export default router;