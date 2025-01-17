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
  // TODO: Check isBold/Italic/Underline and set buttons classNames accordingly
  const baseButtonClassName =
    "mv-appearance-none mv-w-fit mv-font-semibold mv-whitespace-nowrap mv-flex mv-items-center mv-justify-center mv-align-middle mv-text-center mv-rounded-lg mv-text-xs mv-p-2 mv-leading-4";
  const disabledClassName = "mv-bg-neutral-50 mv-text-neutral-300";
  const enabledClassName =
    "mv-text-gray hover:mv-text-gray-800 hover:mv-bg-neutral-50 focus:mv-text-gray-800 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 mv-cursor-pointer peer-focus:mv-ring-2 peer-focus:mv-ring-blue-500";
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
    <div className="mv-flex mv-gap-1 mv-w-full mv-h-10 mv-items-center mv-border-b mv-border-gray-200 mv-pl-1">
      <button
        className={`${baseButtonClassName} ${
          canUndo === true ? enabledClassName : disabledClassName
        }`}
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
      </button>
      <button
        className={`${baseButtonClassName} ${
          canRedo === true ? enabledClassName : disabledClassName
        }`}
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
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}`}
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
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}`}
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
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}`}
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
      </button>
      <div className="mv-group">
        <div>
          <input
            id="add-link"
            disabled={canInsertLink === false}
            type="checkbox"
            className="mv-peer mv-fixed mv-w-0 mv-h-0 mv-opacity-0 mv-top-0 mv-left-0 group-has-[:checked]:mv-w-screen group-has-[:checked]:mv-h-dvh"
            checked={showInsertLinkMenu}
            onChange={(event) => {
              setShowInsertLinkMenu(event.currentTarget.checked);
              if (linkInputRef.current !== null) {
                linkInputRef.current.focus();
              }
            }}
            onFocus={() => {
              setShowInsertLinkMenu(false);
            }}
          />
          <label
            htmlFor="add-link"
            className={`${baseButtonClassName} ${
              canInsertLink === true ? enabledClassName : disabledClassName
            }`}
          >
            <LinkIcon />
          </label>
        </div>
        <div className="mv-absolute mv-left-0 mv-max-w-1/2 mv-mt-1">
          <div className="group-has-[:checked]:mv-block mv-hidden mv-bg-white mv-border-x mv-border-b mv-border-gray-200 mv-px-2 mv-pb-2 mv-rounded-br-lg">
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
      <button
        className={`${baseButtonClassName} ${enabledClassName}`}
        onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          event.stopPropagation();
          event.preventDefault();
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        onFocus={() => {
          setShowInsertLinkMenu(false);
        }}
        title="Insert bullet list"
        aria-label="Insert bullet list"
        type="button"
      >
        <UnorderedList />
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}`}
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
      </button>
    </div>
  );
}

function LoadingToolbar() {
  const buttonClassName =
    "mv-appearance-none mv-w-fit mv-font-semibold mv-whitespace-nowrap mv-flex mv-items-center mv-justify-center mv-align-middle mv-text-center mv-rounded-lg mv-text-xs mv-p-2 mv-leading-4 mv-bg-neutral-50 mv-text-neutral-300";
  return (
    <div className="mv-flex mv-gap-1 mv-w-full mv-h-10 mv-items-center mv-border-b mv-border-gray-200 mv-pl-1">
      <button
        className={buttonClassName}
        disabled={true}
        title="Undo (Ctrl+Z or ⌘+Z)"
        aria-label="Undo"
        type="button"
      >
        <ArrowCounterClockwise />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title="Redo (Ctrl+Shift+Z or ⌘+Shift+Z)"
        aria-label="Redo"
        type="button"
      >
        <ArrowClockwise />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title="Bold (Ctrl+B or ⌘+B)"
        aria-label="Bold"
        type="button"
      >
        <Bold />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title="Italic (Ctrl+I or ⌘+I)"
        aria-label="Italic"
        type="button"
      >
        <Italic />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title="Underline (Ctrl+U or ⌘+U)"
        aria-label="Underline"
        type="button"
      >
        <Underline />
      </button>
      <div className="mv-group">
        <div>
          <input
            id="add-link"
            disabled={true}
            type="checkbox"
            className="mv-peer mv-fixed mv-w-0 mv-h-0 mv-opacity-0 mv-top-0 mv-left-0 group-has-[:checked]:mv-w-screen group-has-[:checked]:mv-h-dvh"
            defaultChecked={false}
          />
          <label
            className={`${buttonClassName} mv-text-gray hover:mv-text-gray-800 hover:mv-bg-neutral-50 focus:mv-text-gray-800 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 mv-cursor-pointer peer-focus:mv-ring-2 peer-focus:mv-ring-blue-500`}
            htmlFor="add-link"
          >
            <LinkIcon />
          </label>
        </div>
        <div className="mv-absolute mv-left-0 mv-max-w-1/2 mv-mt-1">
          <div className="group-has-[:checked]:mv-block mv-hidden mv-bg-white mv-border-x mv-border-b mv-border-gray-200 mv-px-2 mv-pb-2 mv-rounded-br-lg">
            <div className="mv-flex mv-gap-1 mv-items-center mv-abolute mv-top-0">
              <Input id="linkInput" disabled={true} defaultValue="https://">
                <Input.Label htmlFor="linkInput">Insert Link</Input.Label>
                <Input.Controls>
                  <Button
                    disabled={true}
                    variant="outline"
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
      <button
        className={buttonClassName}
        disabled={true}
        title="Insert bullet list"
        aria-label="Insert bullet list"
        type="button"
      >
        <UnorderedList />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title="Insert numbered list"
        aria-label="Insert numbered list"
        type="button"
      >
        <OrderedList />
      </button>
    </div>
  );
}

export { ToolbarPlugin, LoadingToolbar };
