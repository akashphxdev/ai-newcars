// features/stories/story.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { StoryGroup } from "./story.types";

export async function getHomeStories(limit = 10): Promise<StoryGroup[]> {
  const groups = await apiFetch<StoryGroup[]>(`/home/stories?limit=${limit}`, { next: { revalidate: 120 } });
  return groups.map((g) => ({
    ...g,
    coverMediaUrl: getUploadUrl(g.coverMediaUrl) ?? g.coverMediaUrl,
    items: g.items.map((item) => ({ ...item, mediaUrl: getUploadUrl(item.mediaUrl) ?? item.mediaUrl })),
  }));
}
