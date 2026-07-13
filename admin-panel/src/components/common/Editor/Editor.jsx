// src/components/common/Editor/Editor.jsx
//
// Shared rich-text editor (Tiptap) — used wherever long-form HTML
// content needs to be authored (currently: Articles). Lives under
// components/common because it isn't specific to any one module.
//
// Adapted from the originally-supplied editor with a few changes:
//   - Image upload/delete now goes through the project's `apiClient`
//     (axios instance with baseURL + auth header) instead of raw
//     fetch("/api/admin/upload") calls to an endpoint that didn't
//     exist in this project. Backend side: see article.routes.ts's
//     POST/DELETE /articles/upload-image.
//   - Removed "upload an image by pasting an external URL" (silently
//     re-hosting whatever URL is pasted). That's an SSRF-shaped
//     feature — the server would be fetching an arbitrary
//     admin-supplied URL — and wasn't worth the risk for what it added.
//     Pasted/dropped image *files* still upload exactly as before;
//     pasted external image *URLs* are now left as external links
//     rather than silently downloaded and re-hosted.
//   - Added a live word/character count + estimated read time footer
//     (surfaced via the optional onStatsChange prop) since Article has
//     its own readTimeMinutes field the host form can prefill from it.
//   - Added a fullscreen/distraction-free toggle.
//   - Removed debug console.log calls.

import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconCode,
  IconColumnInsertLeft,
  IconColumnInsertRight,
  IconColumnRemove,
  IconH1,
  IconH2,
  IconH3,
  IconHighlight,
  IconItalic,
  IconLayoutDistributeHorizontal,
  IconLine,
  IconLinkMinus,
  IconLinkPlus,
  IconList,
  IconListCheck,
  IconListNumbers,
  IconMaximize,
  IconMinimize,
  IconPhoto,
  IconPhotoPlus,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconRowRemove,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconTableMinus,
  IconTablePlus,
  IconUnderline,
} from "@tabler/icons-react";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import { Color } from "@tiptap/extension-color";
import Document from "@tiptap/extension-document";
import Dropcursor from "@tiptap/extension-dropcursor";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import History from "@tiptap/extension-history";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Image } from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Strike from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Text from "@tiptap/extension-text";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import ImageResize from "tiptap-extension-resize-image";
import { apiClient, getRelativeUploadPath, getUploadUrl } from "../../../lib/apiClient";
import "./EditorStyle.css";

const WORDS_PER_MINUTE = 200;

/**
 * Converts legacy JSON-array content to HTML for TipTap. New content is
 * already an HTML string and is returned as-is.
 */
function normalizeContent(content) {
  if (!content) return content;

  let arr;
  try {
    arr = JSON.parse(content);
  } catch {
    return content; // Already an HTML string
  }

  if (!Array.isArray(arr)) return content;

  const parts = [];
  let inList = false;

  for (const item of arr) {
    if (typeof item !== "string") continue;

    if (item.startsWith("- \n")) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      const text = item.replace(/^-\s*\n\s*/, "").trim();
      parts.push(`<li><p>${text}</p></li>`);
    } else {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      const trimmed = item.trim();
      if (!trimmed) continue;

      if (trimmed.endsWith(":")) {
        parts.push(`<p>${trimmed}</p>`);
      } else if (trimmed.length <= 70 && !/[.,]$/.test(trimmed)) {
        if (/^\d+\.\s/.test(trimmed)) {
          parts.push(`<h3>${trimmed}</h3>`);
        } else {
          parts.push(`<h2>${trimmed}</h2>`);
        }
      } else {
        parts.push(`<p>${trimmed}</p>`);
      }
    }
  }

  if (inList) parts.push("</ul>");
  return parts.join("");
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const LinkedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      href: { default: null },
      target: { default: "_blank" },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { href, target, ...rest } = HTMLAttributes;
    const img = ["img", rest];
    return href ? ["a", { href, target }, img] : img;
  },

  parseHTML() {
    return [
      {
        tag: "a[href] > img",
        getAttrs: (node) => {
          const parent = node.parentNode;
          return {
            ...node.attributes,
            href: parent.getAttribute("href"),
            target: parent.getAttribute("target") || "_blank",
          };
        },
      },
      { tag: "img" },
    ];
  },
});

// content: HTML string (or legacy JSON array, auto-converted).
// onChange(html): called on every edit.
// onStatsChange({ words, characters, readTimeMinutes }): optional,
//   called whenever the content changes — handy for prefilling a
//   sibling "read time" field in the host form (e.g. Article's
//   readTimeMinutes).
function Editor({ content, onChange, onStatsChange }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState({ words: 0, characters: 0, readTimeMinutes: 0 });

  const processingImagesRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onStatsChangeRef = useRef(onStatsChange);
  onStatsChangeRef.current = onStatsChange;
  // Track all local image srcs currently in editor to detect deletions.
  const trackedImagesRef = useRef(new Set());
  // Ref for deleteImageFromServer so onUpdate's closure always sees the
  // latest version without needing to be in useEditor's dependency list.
  const deleteImageFromServerRef = useRef(null);

  const dataUriToFile = (dataUri, index) => {
    const match = dataUri.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
    if (!match) return null;
    const mimeType = match[1];
    const base64Data = match[2];
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const extMap = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };
    const ext = extMap[mimeType] || "jpg";
    return new File([bytes], `pasted-${Date.now()}-${index}.${ext}`, { type: mimeType });
  };

  const uploadImage = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await apiClient.post("/articles/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Store the absolute URL directly in the content HTML — this body
    // is eventually rendered on the public site (a different origin
    // than the API), so a server-relative path wouldn't resolve there.
    return getUploadUrl(res.data.data.url);
  }, []);

  const deleteImageFromServer = useCallback(async (src) => {
    // Only clean up images this editor actually uploaded — skip
    // external URLs and data URIs (nothing to delete server-side).
    if (!src || src.startsWith("data:")) return;
    try {
      await apiClient.delete("/articles/upload-image", { data: { path: getRelativeUploadPath(src) } });
    } catch {
      // Best-effort cleanup — a failed delete here shouldn't interrupt
      // editing. The backend also treats "already gone" as a non-error.
    }
  }, []);
  deleteImageFromServerRef.current = deleteImageFromServer;

  // Replaces any data-URI images (pasted as base64, e.g. from some
  // paste sources that don't expose a file object) with the uploaded
  // URL. Uses a flag to prevent the onUpdate -> replace -> onUpdate
  // loop that would otherwise fire while this runs.
  const replaceDataUriImages = useCallback(
    async (editorInstance) => {
      if (!editorInstance || processingImagesRef.current) return;

      const imageNodes = [];
      editorInstance.state.doc.descendants((node, pos) => {
        if (node.type.name !== "image") return;
        const src = node.attrs?.src;
        if (typeof src === "string" && src.startsWith("data:image/")) {
          imageNodes.push({ pos, src });
        }
      });

      if (!imageNodes.length) return;

      processingImagesRef.current = true;
      try {
        for (let i = 0; i < imageNodes.length; i++) {
          const { pos, src } = imageNodes[i];
          const currentNode = editorInstance.state.doc.nodeAt(pos);
          if (!currentNode || currentNode.type.name !== "image" || currentNode.attrs?.src !== src) continue;

          const file = dataUriToFile(src, i);
          if (!file) continue;
          const imageUrl = await uploadImage(file);

          editorInstance.chain().setNodeSelection(pos).updateAttributes("image", { src: imageUrl }).run();
        }
      } catch {
        // Leave the data-URI in place if upload failed — better than
        // silently dropping the image the admin just pasted.
      } finally {
        processingImagesRef.current = false;
        onChangeRef.current(editorInstance.getHTML());
      }
    },
    [uploadImage],
  );

  const updateStats = useCallback((editorInstance) => {
    const text = editorInstance.getText();
    const words = countWords(text);
    const next = {
      words,
      characters: text.length,
      readTimeMinutes: words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
    setStats(next);
    onStatsChangeRef.current?.(next);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document, Paragraph, Text, Dropcursor,
      BulletList, ListItem, OrderedList,
      Heading.configure({ levels: [1, 2, 3] }),
      Bold, Underline, Italic, Strike,
      TextAlign.configure({ types: ["heading", "paragraph", "table"] }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Blockquote, HorizontalRule, HardBreak,
      Code,
      Highlight.configure({ multicolor: true }),
      History,
      TextStyle, Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      LinkedImage,
      ImageResize,
      Subscript, Superscript,
      Placeholder.configure({ placeholder: "Write your article content..." }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https"],
        isAllowedUri: (url, ctx) => {
          try {
            const parsedUrl = url.includes(":") ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`);
            if (!ctx.defaultValidate(parsedUrl.href)) return false;
            const disallowedProtocols = ["ftp", "file", "mailto"];
            const protocol = parsedUrl.protocol.replace(":", "");
            if (disallowedProtocols.includes(protocol)) return false;
            const allowedProtocols = ctx.protocols.map((p) => (typeof p === "string" ? p : p.scheme));
            if (!allowedProtocols.includes(protocol)) return false;
            return true;
          } catch {
            return false;
          }
        },
        shouldAutoLink: (url) => {
          try {
            const parsedUrl = url.includes(":") ? new URL(url) : new URL(`https://${url}`);
            const disallowedDomains = ["example-no-autolink.com"];
            return !disallowedDomains.includes(parsedUrl.hostname);
          } catch {
            return false;
          }
        },
      }),
    ],

    content: normalizeContent(content),

    onCreate: ({ editor: editorInstance }) => {
      const initialSrcs = new Set();
      editorInstance.state.doc.descendants((node) => {
        if (node.type.name === "image") {
          const src = node.attrs?.src;
          if (src && !src.startsWith("data:")) initialSrcs.add(src);
        }
      });
      trackedImagesRef.current = initialSrcs;
      updateStats(editorInstance);
    },

    editorProps: {
      handlePaste(view, event) {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const items = clipboardData.items;
        const imageFiles = [];
        for (const item of items) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }

        if (imageFiles.length > 0) {
          event.preventDefault();
          const pastePos = view.state.selection.from;
          imageFiles.forEach(async (file, index) => {
            try {
              const imageUrl = await uploadImage(file);
              const insertPos = pastePos + index;
              editor?.chain().focus().setTextSelection(insertPos).setImage({ src: imageUrl }).run();
              onChangeRef.current(editor?.getHTML() || "");
            } catch {
              // Upload failed — leave the rest of the paste (if any
              // text/other content) alone rather than blocking it.
            }
          });
          return true;
        }

        return false; // Plain text / formatted text — let TipTap handle it natively.
      },

      handleDrop(view, event) {
        const files = [];
        if (event.dataTransfer?.files?.length) {
          for (const file of event.dataTransfer.files) {
            if (file.type.startsWith("image/")) files.push(file);
          }
        }
        if (!files.length) return false;

        event.preventDefault();
        const coords = { left: event.clientX, top: event.clientY };
        const dropPos = view.posAtCoords(coords)?.pos ?? view.state.selection.from;

        files.forEach(async (file, index) => {
          try {
            const imageUrl = await uploadImage(file);
            editor?.chain().focus().setTextSelection(dropPos + index).setImage({ src: imageUrl }).run();
            onChangeRef.current(editor?.getHTML() || "");
          } catch {
            // Same as paste — don't block the rest of the drop.
          }
        });
        return true;
      },
    },

    onUpdate: ({ editor: editorInstance }) => {
      if (!processingImagesRef.current) {
        onChangeRef.current(editorInstance.getHTML());
      }
      updateStats(editorInstance);

      // Detect images removed from the doc since the last update and
      // clean them up server-side.
      const currentSrcs = new Set();
      editorInstance.state.doc.descendants((node) => {
        if (node.type.name === "image") {
          const src = node.attrs?.src;
          if (src && !src.startsWith("data:")) currentSrcs.add(src);
        }
      });

      const prevSrcs = trackedImagesRef.current;
      trackedImagesRef.current = currentSrcs;
      for (const src of prevSrcs) {
        if (!currentSrcs.has(src)) {
          void deleteImageFromServerRef.current?.(src);
        }
      }

      void replaceDataUriImages(editorInstance);
    },
  });

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    try {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } catch (e) {
      alert(e.message);
    }
  };

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const imageUrl = await uploadImage(file);
        editor.chain().focus().setImage({ src: imageUrl }).run();
        onChangeRef.current(editor.getHTML());
      } catch {
        alert("Image upload failed. Please try again.");
      }
    };
  };

  const handleAddLinkToImage = () => {
    if (!editor) return;
    const { state } = editor;
    const { selection } = state;
    const pos = selection.from;
    const node = state.doc.nodeAt(pos);
    if (!node || node.type.name !== "image") {
      alert("Please select an image to add a link.");
      return;
    }
    const currentAttrs = node.attrs;
    const currentHref = currentAttrs.href || "";
    const href = prompt("Enter URL to link this image:", currentHref);
    if (href !== null) {
      if (currentHref !== href) {
        editor.chain().focus().setNodeSelection(pos).updateAttributes("image", { ...currentAttrs, href, target: "_blank" }).run();
      } else {
        alert("This image already has a link.");
      }
    }
  };

  if (!editor) return null;

  return (
    <div className={isFullscreen ? "editor-root editor-root--fullscreen" : "editor-root"}>
      <div className="control-group">
        <div>
          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }} disabled={!editor.can().undo()} title="Undo">
              <IconArrowBackUp stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }} disabled={!editor.can().redo()} title="Redo">
              <IconArrowForwardUp stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={editor.isActive("bold") ? "is-active" : ""} title="Bold">
              <IconBold stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }} className={editor.isActive("underline") ? "is-active" : ""} title="Underline">
              <IconUnderline stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={editor.isActive("italic") ? "is-active" : ""} title="Italic">
              <IconItalic stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }} className={editor.isActive("strike") ? "is-active" : ""} title="Strikethrough">
              <IconStrikethrough stroke={2} />
            </button>
          </div>

          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setHardBreak().run(); }} title="Line break">
              <IconLine stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run(); }} className={editor.isActive("code") ? "is-active" : ""} title="Inline code">
              <IconCode stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight().run(); }} className={editor.isActive("highlight") ? "is-active" : ""} title="Highlight">
              <IconHighlight stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }} title="Horizontal rule">
              <IconLayoutDistributeHorizontal stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleSubscript().run(); }} className={editor.isActive("subscript") ? "is-active" : ""} title="Subscript">
              <IconSubscript stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleSuperscript().run(); }} className={editor.isActive("superscript") ? "is-active" : ""} title="Superscript">
              <IconSuperscript stroke={2} />
            </button>
          </div>

          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} className={editor.isActive("bulletList") ? "is-active" : ""} title="Bullet list">
              <IconList stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} className={editor.isActive("orderedList") ? "is-active" : ""} title="Numbered list">
              <IconListNumbers stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleTaskList().run(); }} className={editor.isActive("taskList") ? "is-active" : ""} title="Task list">
              <IconListCheck stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }} className={editor.isActive("blockquote") ? "is-active" : ""} title="Blockquote">
              <IconBlockquote stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); addImage(); }} title="Insert image">
              <IconPhotoPlus stroke={2} />
            </button>
          </div>

          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); setLink(); }} className={editor.isActive("link") ? "is-active" : ""} title="Add link">
              <IconLinkPlus stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetLink().run(); }} disabled={!editor.isActive("link")} title="Remove link">
              <IconLinkMinus stroke={2} />
            </button>
          </div>

          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("left").run(); }} className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""} title="Align left">
              <IconAlignLeft stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("center").run(); }} className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""} title="Align center">
              <IconAlignCenter stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("right").run(); }} className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""} title="Align right">
              <IconAlignRight stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("justify").run(); }} className={editor.isActive({ textAlign: "justify" }) ? "is-active" : ""} title="Justify">
              <IconAlignJustified stroke={2} />
            </button>
          </div>

          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }} className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""} title="Heading 1">
              <IconH1 stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }} className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""} title="Heading 2">
              <IconH2 stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }} className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""} title="Heading 3">
              <IconH3 stroke={2} />
            </button>
          </div>

          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }} title="Insert table">
              <IconTablePlus stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }} title="Insert row above">
              <IconRowInsertTop stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }} title="Insert row below">
              <IconRowInsertBottom stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }} title="Delete row">
              <IconRowRemove stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }} title="Insert column left">
              <IconColumnInsertLeft stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }} title="Insert column right">
              <IconColumnInsertRight stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }} title="Delete column">
              <IconColumnRemove stroke={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }} title="Delete table">
              <IconTableMinus stroke={2} />
            </button>
          </div>

          <div className="btnSection">
            <input
              type="color"
              onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
              value={editor.getAttributes("textStyle").color || "#000000"}
              title="Text color"
            />
            {[
              { label: "Purple", color: "#958DF1" },
              { label: "Red", color: "#F98181" },
              { label: "Orange", color: "#FBBC88" },
              { label: "Yellow", color: "#FAF594" },
              { label: "Blue", color: "#70CFF8" },
              { label: "Teal", color: "#94FADB" },
              { label: "Green", color: "#B9F18D" },
            ].map(({ label, color }) => (
              <button
                key={color}
                onClick={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); }}
                className={editor.isActive("textStyle", { color }) ? "is-active" : ""}
                title={label}
              >{label}</button>
            ))}
            <button onClick={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }} title="Clear color">
              Unset color
            </button>
          </div>

          <div className="btnSection">
            <button onClick={(e) => { e.preventDefault(); handleAddLinkToImage(); }} title="Link selected image">
              <IconPhoto stroke={2} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setIsFullscreen((v) => !v); }}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <IconMinimize stroke={2} /> : <IconMaximize stroke={2} />}
            </button>
          </div>
        </div>
      </div>

      <div className="editor-container">
        <EditorContent editor={editor} />
      </div>

      <div className="editor-stats">
        <span>{stats.words} word{stats.words === 1 ? "" : "s"}</span>
        <span className="editor-stats-sep">·</span>
        <span>{stats.characters} character{stats.characters === 1 ? "" : "s"}</span>
        <span className="editor-stats-sep">·</span>
        <span>~{stats.readTimeMinutes} min read</span>
      </div>
    </div>
  );
}

export default Editor;