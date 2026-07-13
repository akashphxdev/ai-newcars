// src/modules/articles/articleComment/articleComment.types.ts

export interface ArticleCommentListItem {
  id: number;
  articleId: number;
  article: { id: number; title: string; slug: string };
  userId: number;
  user: { id: number; name: string };
  parentCommentId: number | null;
  body: string;
  status: string;
  createdAt: Date;
  replyCount: number;
}