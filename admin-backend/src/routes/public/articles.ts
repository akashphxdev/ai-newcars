// src/routes/public/articles.ts
import { Router } from 'express';
import ArticleRoute from '@/modules/public/articles/article/article.routes';

const router = Router();

router.use('/', ArticleRoute);

export default router;
