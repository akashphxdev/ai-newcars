// src/modules/stories/storyItem/storyItem.types.ts

export interface StoryItemAdminSummary {
  id: number;
  name: string;
}

export interface StoryItemGroupSummary {
  id: number;
  title: string;
}

export interface StoryItemRecord {
  id: number;
  groupId: number;
  group: StoryItemGroupSummary;
  // image | video — see MEDIA_TYPES in storyItem.validation.ts.
  mediaType: string;
  mediaUrl: string;
  description: string | null;
  link: string | null;
  viewCount: number;
  // draft | published | scheduled — see STORY_ITEM_STATUSES in storyItem.validation.ts.
  status: string;
  startAt: Date | null;
  endAt: Date | null;
  displayOrder: number;
  createdBy: number | null;
  createdByAdmin: StoryItemAdminSummary | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedByAdmin: StoryItemAdminSummary | null;
  updatedAt: Date | null;
}

export interface StoryItemUploadMediaResult {
  id: number;
  mediaUrl: string;
}

export interface StoryItemViewResult {
  id: number;
  viewCount: number;
}