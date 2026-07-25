// src/modules/public/home/story/story.types.ts
//
// Public-safe shape — no viewCount/audit/moderation fields. A group only
// carries its own published items, so the website's viewer never needs
// to reach outside a group for its content or its ambient background.

export interface PublicHomeStoryItemRecord {
  id: number;
  mediaType: string; // 'image' | 'video'
  mediaUrl: string;
  description: string | null;
  link: string | null;
}

export interface PublicHomeStoryGroupRecord {
  id: number;
  title: string;
  coverMediaType: string; // 'image' | 'video'
  coverMediaUrl: string;
  items: PublicHomeStoryItemRecord[];
}
