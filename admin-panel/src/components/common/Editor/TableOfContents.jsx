// src/components/common/Editor/TableOfContents.jsx
//
// Live outline of the article's headings — rescans on every editor
// update and lets the admin jump straight to a section. Purely a
// navigation aid; it doesn't write anything into the saved content.

import { useEffect, useState } from "react";

export default function TableOfContents({ editor }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!editor) return undefined;

    const collect = () => {
      const items = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== "heading") return;
        const text = node.textContent.trim();
        if (!text) return;
        items.push({ level: node.attrs.level, text, pos });
      });
      setHeadings(items);
    };

    collect();
    editor.on("update", collect);
    return () => editor.off("update", collect);
  }, [editor]);

  if (!editor) return null;

  const goTo = (pos) => {
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

  return (
    <div className="editor-toc">
      <p className="editor-toc-title">Outline</p>
      {headings.length === 0 ? (
        <p className="editor-toc-empty">Headings you add will show up here.</p>
      ) : (
        <nav>
          {headings.map((h, i) => (
            <button
              key={`${h.pos}-${i}`}
              type="button"
              className={`editor-toc-item editor-toc-level-${h.level}`}
              onClick={() => goTo(h.pos)}
            >
              {h.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
