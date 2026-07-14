// src/components/common/Editor/SlashCommandMenu.jsx
//
// Dropdown list rendered by the "/" slash-command extension (see
// extensions/SlashCommand.js). Tiptap's Suggestion plugin drives this
// via a forwarded ref — onKeyDown intercepts Up/Down/Enter while the
// menu is open so arrow keys move the selection instead of the cursor.

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const SlashCommandMenu = forwardRef(function SlashCommandMenu({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="slash-menu">
        <p className="slash-menu-empty">No matching blocks</p>
      </div>
    );
  }

  return (
    <div className="slash-menu">
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          className={`slash-menu-item${index === selectedIndex ? " is-selected" : ""}`}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="slash-menu-icon">{item.icon}</span>
          <span className="slash-menu-text">
            <span className="slash-menu-title">{item.title}</span>
            <span className="slash-menu-desc">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
});

export default SlashCommandMenu;
