// src/routes/v1/articles.ts
import { Router } from 'express';
import articleCategoryRoute from '@/modules/articles/articleCategory/articleCategory.routes';
import articleRoute from '@/modules/articles/article/article.routes';
import articleCommentRoute from '@/modules/articles/articleComment/articleComment.routes';

const router = Router();

router.use('/categories', articleCategoryRoute);
router.use('/comments', articleCommentRoute);
router.use('/', articleRoute);

export default router;