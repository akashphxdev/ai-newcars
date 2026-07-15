// src/modules/stories/storyGroup/storyGroup.types.ts

export interface StoryGroupAdminSummary {
  id: number;
  name: string;
}

export interface StoryGroupRecord {
  id: number;
  title: string;
  // image | video — see MEDIA_TYPES in storyGroup.validation.ts.
  coverMediaType: string;
  coverMediaUrl: string;
  viewCount: number;
  isActive: boolean;
  displayOrder: number;
  createdBy: number | null;
  createdByAdmin: StoryGroupAdminSummary | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedByAdmin: StoryGroupAdminSummary | null;
  updatedAt: Date | null;
}

export interface StoryGroupUploadCoverResult {
  id: number;
  coverMediaUrl: string;
}

export interface StoryGroupViewResult {
  id: number;
  viewCount: number;
}