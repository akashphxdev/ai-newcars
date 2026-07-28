"use client";
import { useState } from "react";
import ArticleCard from "./ArticleCard";
import { getArticlesByCategoryPaginated } from "@/features/articles/article.api";
import type { HomeArticle } from "@/features/articles/article.types";
import type { Pagination } from "@/lib/apiClient";

const PAGE_SIZE = 8;

// The server component (page.tsx) fetches page 1 up front; every
// subsequent page is fetched here on "Load more" — the category's full
// article list is never pulled in one request, however large it grows.
export default function CategoryArticlesGrid({
  categorySlug,
  initialArticles,
  initialPagination,
}: {
  categorySlug: string;
  initialArticles: HomeArticle[];
  initialPagination: Pagination;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMore = pagination.page < pagination.totalPages;

  async function loadMore() {
    setLoading(true);
    setError("");
    try {
      const next = await getArticlesByCategoryPaginated(categorySlug, pagination.page + 1, PAGE_SIZE);
      setArticles((prev) => [...prev, ...next.articles]);
      setPagination(next.pagination);
    } catch {
      setError("Couldn't load more articles — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (articles.length === 0) {
    return (
      <p className="py-16 text-center text-[14px] font-medium text-muted">
        No articles in this category yet — check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} className="w-full" />
        ))}
      </div>

      {error && <p className="mt-4 text-center text-[13px] font-medium text-red-500">{error}</p>}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="cursor-pointer rounded-full border-[1.5px] border-brand px-6 py-2.5 text-[13.5px] font-bold text-brand transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
