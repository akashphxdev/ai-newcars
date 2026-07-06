// src/modules/newCars/video/video.types.ts

export interface VideoModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

export interface VideoRecord {
  id: number;
  modelId: number;
  title: string;
  videoType: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  model: VideoModelSummary;
}