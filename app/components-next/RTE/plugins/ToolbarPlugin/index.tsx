import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import React from "react";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Bold } from "~/components-next/icons/Bold";
import { ArrowCounterClockwise } from "~/components-next/icons/ArrowCounterClockwise";
import { ArrowClockwise } from "~/components-next/icons/ArrowClockwise";
import { Italic } from "~/components-next/icons/Italic";
import { Underline } from "~/components-next/icons/Underline";
import { UnorderedList } from "~/components-next/icons/UnorderedList";
import { OrderedList } from "~/components-next/icons/OrderedList";
import { LinkIcon } from "~/components-next/icons/LinkIcon";
import { Add } from "~/components-next/icons/Add";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const linkInputRef = React.useRef<HTMLInputElement>(null);
  const [linkInputValue, setLinkInputValue] = React.useState("https://");
  const [showInsertLinkMenu, setShowInsertLinkMenu] = React.useState(false);
  const [canInsertLink, setCanInsertLink] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  React.useEffect(() => {
    editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return payload;
      },
      COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return payload;
      },
      COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        if (selection !== null && $isRangeSelection(selection)) {
          if (selection.getTextContent().length > 0) {
            setCanInsertLink(true);
          } else {
            setCanInsertLink(false);
          }
        } else {
          setCanInsertLink(false);
        }
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return (
    <div className="mv-flex mv-gap-1 mv-w-full mv-h-10 mv-items-center mv-border-x mv-border-t mv-border-gray-200 mv-rounded-t-lg">
      <Button
        variant="ghost"
        size="x-small"
        disabled={canUndo === false}
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        title="Undo (Ctrl+Z or ⌘+Z)"
        aria-label="Undo"
        type="button"
      >
        <ArrowCounterClockwise />
      </Button>
      <Button
        variant="ghost"
        size="x-small"
        disabled={canRedo === false}
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        title="Redo (Ctrl+Shift+Z or ⌘+Shift+Z)"
        aria-label="Redo"
        type="button"
      >
        <ArrowClockwise />
      </Button>
      {/* TODO: Divider */}
      <Button
        variant="ghost"
        size="x-small"
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        title="Bold (Ctrl+B or ⌘+B)"
        aria-label="Bold"
        type="button"
      >
        <Bold />
      </Button>
      <Button
        variant="ghost"
        size="x-small"
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        title="Italic (Ctrl+I or ⌘+I)"
        aria-label="Italic"
        type="button"
      >
        <Italic />
      </Button>
      <Button
        variant="ghost"
        size="x-small"
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        title="Underline (Ctrl+U or ⌘+U)"
        aria-label="Underline"
        type="button"
      >
        <Underline />
      </Button>
      {/* TODO: Divider */}
      <Button
        variant="ghost"
        size="x-small"
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        title="Insert bullet list"
        aria-label="Insert bullet list"
        type="button"
      >
        <UnorderedList />
      </Button>
      <Button
        variant="ghost"
        size="x-small"
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        title="Insert numbered list"
        aria-label="Insert numbered list"
        type="button"
      >
        <OrderedList />
      </Button>
      {/* TODO: Divider */}
      <div className="mv-group">
        <div>
          <Button
            as="label"
            disabled={canInsertLink === false}
            variant="ghost"
            size="x-small"
            htmlFor="add-link"
            className={canInsertLink === true ? "mv-cursor-pointer" : undefined}
          >
            <LinkIcon />
          </Button>
          <input
            id="add-link"
            disabled={canInsertLink === false}
            type="checkbox"
            className="mv-absolute mv-w-0 mv-h-0 mv-opacity-0"
            checked={showInsertLinkMenu}
            onChange={(event) => {
              setShowInsertLinkMenu(event.currentTarget.checked);
              if (linkInputRef.current !== null) {
                linkInputRef.current.focus();
              }
            }}
          />
        </div>
        <div className="mv-absolute mv-left-0 mv-w-full">
          <div className="group-has-[:checked]:mv-block mv-hidden mv-bg-white mv-border mv-border-gray-200 mv-px-2 mv-pb-2">
            <div className="mv-flex mv-gap-1 mv-items-center mv-abolute mv-top-0">
              <Input
                id="linkInput"
                ref={linkInputRef}
                value={linkInputValue}
                onChange={(event) =>
                  setLinkInputValue(event.currentTarget.value)
                }
              >
                <Input.Label htmlFor="linkInput">Insert Link</Input.Label>
                <Input.Controls>
                  <Button
                    variant="outline"
                    size="x-small"
                    onClick={(
                      event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                    ) => {
                      event.stopPropagation();
                      event.preventDefault();
                      editor.dispatchCommand(
                        TOGGLE_LINK_COMMAND,
                        linkInputValue
                      );
                      setLinkInputValue("https://");
                      setShowInsertLinkMenu(false);
                    }}
                    title="Insert link"
                    aria-label="Insert link"
                    type="button"
                  >
                    <Add />
                  </Button>
                </Input.Controls>
              </Input>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ToolbarPlugin };
