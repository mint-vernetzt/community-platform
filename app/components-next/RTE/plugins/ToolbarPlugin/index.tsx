import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND } from "lexical";
import React from "react";

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const [linkInputValue, setLinkInputValue] = React.useState("https://");

  return (
    // TODO: Add styles and disabled
    <div className="mv-flex mv-gap-1 mv-w-full mv-h-10 mv-items-center">
      <button
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        title="Undo (Ctrl+Z or ⌘+Z)"
        aria-label="Undo"
        type="button"
      >
        Undo
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        title="Redo (Ctrl+Shift+Z or ⌘+Shift+Z)"
        aria-label="Redo"
        type="button"
      >
        Redo
      </button>
      {/* TODO: Divider */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        title="Bold (Ctrl+B or ⌘+B)"
        aria-label="Bold"
        type="button"
      >
        Bold
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        title="Italic (Ctrl+I or ⌘+I)"
        aria-label="Italic"
        type="button"
      >
        Italic
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        title="Underline (Ctrl+U or ⌘+U)"
        aria-label="Underline"
        type="button"
      >
        Underline
      </button>
      {/* TODO: Divider */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        title="Insert bullet list"
        aria-label="Insert bullet list"
        type="button"
      >
        Bullet list
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        title="Insert numbered list"
        aria-label="Insert numbered list"
        type="button"
      >
        Numbered list
      </button>
      {/* TODO: Divider */}
      <div className="mv-group">
        <div>
          <label
            htmlFor="add-link"
            className="mv-cursor-pointer mv-select-none"
          >
            Link
          </label>
          <input
            id="add-link"
            type="checkbox"
            className="mv-absolute mv-w-0 mv-h-0 mv-opacity-0"
            defaultChecked={false}
          />
        </div>
        <div className="group-has-[:checked]:mv-block mv-hidden">
          <label
            htmlFor="linkInput"
            className="mv-cursor-pointer mv-select-none"
          >
            Insert Link
          </label>
          <div className="mv-flex mv-gap-1 mv-items-center">
            <input
              id="linkInput"
              value={linkInputValue}
              onChange={(event) => setLinkInputValue(event.currentTarget.value)}
            />
            <button
              // TODO: Link insertion menu
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkInputValue);
                setLinkInputValue("https://");
              }}
              title="Insert link"
              aria-label="Insert link"
              type="button"
            >
              Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ToolbarPlugin };
