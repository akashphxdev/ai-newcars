// src/components/common/Editor/Editor.d.ts
//
// Editor.jsx has no TypeScript types of its own (it's a .jsx file) —
// this declares just the props it's actually called with (see
// pages/Articles/Articles/ArticleModal.tsx), so TSX callers get proper
// type-checking without converting the component itself to TSX.
import type { FC } from "react";

export interface EditorStats {
  words: number;
  characters: number;
  readTimeMinutes: number;
}

export interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  onStatsChange?: (stats: EditorStats) => void;
}

declare const Editor: FC<EditorProps>;
export default Editor;
