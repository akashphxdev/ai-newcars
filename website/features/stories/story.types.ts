// features/stories/story.types.ts
//
// Mirrors admin-backend's PublicHomeStoryGroupRecord / PublicHomeStoryItemRecord
// (modules/public/home/story) — each group only ever carries its own
// published items.

export interface StoryItem {
  id: number;
  mediaType: string; // 'image' | 'video'
  mediaUrl: string;
  description: string | null;
  link: string | null;
}

export interface StoryGroup {
  id: number;
  title: string;
  coverMediaType: string; // 'image' | 'video'
  coverMediaUrl: string;
  items: StoryItem[];
}
