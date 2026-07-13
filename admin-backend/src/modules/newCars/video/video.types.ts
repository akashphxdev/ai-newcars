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
  videoType: number;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: Date;
  isActive: boolean;
  createdAt: Date;
  model: VideoModelSummary;
}

export interface VideoUploadThumbnailResult {
  id: number;
  thumbnailUrl: string;
}