// features/articles/article.api.ts

import { apiFetch, getUploadUrl, ApiError } from "@/lib/apiClient";
import type { HomeArticle, ArticleDetail } from "./article.types";

export async function getHomeArticles(limit = 6): Promise<HomeArticle[]> {
  const articles = await apiFetch<HomeArticle[]>(`/home/articles?limit=${limit}`, { next: { revalidate: 120 } });
  return articles.map((a) => ({ ...a, coverImageUrl: getUploadUrl(a.coverImageUrl) }));
}

// Returns null (not a thrown error) when the article/category doesn't
// exist or isn't published/active — the page calls next/navigation's
// notFound() in that case rather than handling an exception.
export async function getArticleDetail(categorySlug: string, articleSlug: string): Promise<ArticleDetail | null> {
  try {
    const article = await apiFetch<ArticleDetail>(`/articles/${categorySlug}/${articleSlug}`, {
      next: { revalidate: 120 },
    });
    return { ...article, coverImageUrl: getUploadUrl(article.coverImageUrl), ogImageUrl: getUploadUrl(article.ogImageUrl) };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// "More from this category" — shown at the bottom of the article detail
// page, excluding the article currently being read.
export async function getRelatedArticles(categorySlug: string, excludeSlug: string, limit = 4): Promise<HomeArticle[]> {
  const articles = await apiFetch<HomeArticle[]>(
    `/articles/${categorySlug}?exclude=${encodeURIComponent(excludeSlug)}&limit=${limit}`,
    { next: { revalidate: 120 } },
  );
  return articles.map((a) => ({ ...a, coverImageUrl: getUploadUrl(a.coverImageUrl) }));
}

// Latest articles in a category, no exclusion — e.g. "Comparison Guides"
// on the /compare listing page.
export async function getArticlesByCategory(categorySlug: string, limit = 6): Promise<HomeArticle[]> {
  const articles = await apiFetch<HomeArticle[]>(`/articles/${categorySlug}?limit=${limit}`, { next: { revalidate: 120 } });
  return articles.map((a) => ({ ...a, coverImageUrl: getUploadUrl(a.coverImageUrl) }));
}
