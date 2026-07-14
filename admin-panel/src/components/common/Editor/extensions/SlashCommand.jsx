// src/components/common/Editor/extensions/SlashCommand.js
//
// Typing "/" at the start of a line (or after whitespace) opens a
// quick-insert menu (see SlashCommandMenu.jsx) for headings, lists,
// tables, images, etc. — same idea as Notion's "/" menu.
//
// Three complex items (Image, YouTube video, Smart link) need callbacks
// from Editor.jsx (file upload dialog, URL prompt, the search modal) —
// those are injected via buildSlashItems() rather than hardcoded here,
// so this file stays free of upload/network concerns.

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import {
  IconBlockquote,
  IconBrandYoutube,
  IconH1,
  IconH2,
  IconH3,
  IconLayoutDistributeHorizontal,
  IconLink,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconPhotoPlus,
  IconTablePlus,
} from "@tabler/icons-react";
import SlashCommandMenu from "../SlashCommandMenu";

// `extra` = { onInsertImage, onInsertYoutube, onOpenSmartLink } — the
// callbacks Editor.jsx passes in so this module never touches upload/
// network logic directly.
export function buildSlashItems(extra) {
  return [
    {
      title: "Heading 1",
      description: "Big section heading",
      icon: <IconH1 stroke={2} size={18} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: <IconH2 stroke={2} size={18} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: <IconH3 stroke={2} size={18} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
    },
    {
      title: "Bullet list",
      description: "Simple unordered list",
      icon: <IconList stroke={2} size={18} />,
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: "Numbered list",
      description: "List with numbering",
      icon: <IconListNumbers stroke={2} size={18} />,
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: "Task list",
      description: "Checkboxes for to-dos",
      icon: <IconListCheck stroke={2} size={18} />,
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      title: "Quote",
      description: "Blockquote for callouts",
      icon: <IconBlockquote stroke={2} size={18} />,
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: "Divider",
      description: "Horizontal rule",
      icon: <IconLayoutDistributeHorizontal stroke={2} size={18} />,
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: "Table",
      description: "3×3 table with a header row",
      icon: <IconTablePlus stroke={2} size={18} />,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      title: "Image",
      description: "Upload an image from your device",
      icon: <IconPhotoPlus stroke={2} size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        extra.onInsertImage();
      },
    },
    {
      title: "YouTube video",
      description: "Embed a video by URL",
      icon: <IconBrandYoutube stroke={2} size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        extra.onInsertYoutube();
      },
    },
    {
      title: "Link to Brand / Car",
      description: "Search and insert a link from your catalog",
      icon: <IconLink stroke={2} size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        extra.onOpenSmartLink();
      },
    },
  ];
}

function createSlashRenderer() {
  let component;
  let element;

  function updatePosition(clientRect) {
    if (!clientRect || !element) return;
    const rect = clientRect();
    if (!rect) return;
    const menuWidth = 260;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 16);
    element.style.left = `${Math.max(8, left)}px`;
    element.style.top = `${rect.bottom + 8}px`;
  }

  return {
    onStart(props) {
      component = new ReactRenderer(SlashCommandMenu, { props, editor: props.editor });
      element = component.element;
      element.style.position = "fixed";
      element.style.zIndex = "2000";
      document.body.appendChild(element);
      updatePosition(props.clientRect);
    },
    onUpdate(props) {
      component.updateProps(props);
      updatePosition(props.clientRect);
    },
    onKeyDown(props) {
      if (props.event.key === "Escape") {
        element?.remove();
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit() {
      element?.remove();
      component?.destroy();
    },
  };
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      items: [],
    };
  },

  addProseMirrorPlugins() {
    const items = this.options.items;
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        startOfLine: false,
        items: ({ query }) =>
          items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
        command: ({ editor, range, props }) => props.command({ editor, range }),
        render: createSlashRenderer,
      }),
    ];
  },
});
