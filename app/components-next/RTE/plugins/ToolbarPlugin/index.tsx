import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  type BaseSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import React from "react";
import { Add } from "~/components-next/icons/Add";
import { ArrowClockwise } from "~/components-next/icons/ArrowClockwise";
import { ArrowCounterClockwise } from "~/components-next/icons/ArrowCounterClockwise";
import { Bold } from "~/components-next/icons/Bold";
import { Italic } from "~/components-next/icons/Italic";
import { LinkIcon } from "~/components-next/icons/LinkIcon";
import { OrderedList } from "~/components-next/icons/OrderedList";
import { Underline } from "~/components-next/icons/Underline";
import { UnorderedList } from "~/components-next/icons/UnorderedList";
import { type RTELocales } from "../../RTE";

function ToolbarPlugin(props: { locales: RTELocales }) {
  const { locales } = props;
  const [editor] = useLexicalComposerContext();

  const linkInputRef = React.useRef<HTMLInputElement>(null);
  const [linkInputValue, setLinkInputValue] = React.useState("https://");
  const showInsertLinkMenuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [showInsertLinkMenu, setShowInsertLinkMenu] = React.useState(false);
  const [canInsertLink, setCanInsertLink] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [isBoldActive, setIsBoldActive] = React.useState(false);
  const [isItalicActive, setIsItalicActive] = React.useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = React.useState(false);
  const [lastValidSelection, setLastValidSelection] =
    React.useState<null | BaseSelection>(null);

  const baseButtonClassName =
    "mv-appearance-none mv-w-fit mv-font-semibold mv-whitespace-nowrap mv-flex mv-items-center mv-justify-center mv-align-middle mv-text-center mv-rounded-lg mv-text-xs mv-p-2 mv-leading-4";
  const disabledClassName = "mv-bg-neutral-50 mv-text-neutral-300";
  const enabledClassName =
    "mv-text-gray hover:mv-text-gray-800 hover:mv-bg-neutral-200 focus:mv-text-gray-800 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 focus:mv-ring-2 focus:mv-ring-blue-500";

  React.useEffect(() => {
    window.addEventListener("click", (event) => {
      if (
        event.target instanceof Node &&
        event.target !== null &&
        linkInputRef.current !== null &&
        event.target !== linkInputRef.current &&
        showInsertLinkMenuButtonRef.current !== null &&
        event.target !== showInsertLinkMenuButtonRef.current &&
        showInsertLinkMenuButtonRef.current.contains(event.target) === false
      ) {
        setShowInsertLinkMenu(false);
      }
    });
  });

  React.useEffect(() => {
    editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (payload) => {
        if (payload === "bold") {
          setIsBoldActive(!isBoldActive);
        } else if (payload === "italic") {
          setIsItalicActive(!isItalicActive);
        } else if (payload === "underline") {
          setIsUnderlineActive(!isUnderlineActive);
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBoldActive(selection.hasFormat("bold"));
          setIsItalicActive(selection.hasFormat("italic"));
          setIsUnderlineActive(selection.hasFormat("underline"));
          if (selection.getTextContent().length > 0) {
            setCanInsertLink(true);
          } else {
            setCanInsertLink(false);
          }
        } else {
          setCanInsertLink(false);
          setIsBoldActive(false);
          setIsItalicActive(false);
          setIsUnderlineActive(false);
        }
        if (selection !== null) {
          setLastValidSelection(selection.clone());
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, isBoldActive, isItalicActive, isUnderlineActive]);

  return (
    <div className="mv-flex mv-gap-1 mv-w-full mv-h-10 mv-items-center mv-border-b mv-border-gray-200 mv-pl-1">
      <button
        className={`${baseButtonClassName} ${
          canUndo === true ? enabledClassName : disabledClassName
        }`}
        disabled={canUndo === false}
        // This is added for Safari which would otherwise lead to focus loss
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        title={locales.rte.toolbar.undo}
        aria-label={locales.rte.toolbar.undo}
        type="button"
      >
        <ArrowCounterClockwise />
      </button>
      <button
        className={`${baseButtonClassName} ${
          canRedo === true ? enabledClassName : disabledClassName
        }`}
        disabled={canRedo === false}
        // This is added for Safari which would otherwise lead to focus loss
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        title={locales.rte.toolbar.redo}
        aria-label={locales.rte.toolbar.redo}
        type="button"
      >
        <ArrowClockwise />
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}${
          isBoldActive ? " mv-bg-neutral-200 hover:mv-bg-neutral-300" : ""
        }`}
        // This is added for Safari which would otherwise lead to focus loss
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        title={locales.rte.toolbar.bold}
        aria-label={locales.rte.toolbar.bold}
        type="button"
      >
        <Bold />
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}${
          isItalicActive ? " mv-bg-neutral-200 hover:mv-bg-neutral-300" : ""
        }`}
        // This is added for Safari which would otherwise lead to focus loss
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        title={locales.rte.toolbar.italic}
        aria-label={locales.rte.toolbar.italic}
        type="button"
      >
        <Italic />
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}${
          isUnderlineActive ? " mv-bg-neutral-200 hover:mv-bg-neutral-300" : ""
        }`}
        // This is added for Safari which would otherwise lead to focus loss
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        title={locales.rte.toolbar.underline}
        aria-label={locales.rte.toolbar.underline}
        type="button"
      >
        <Underline />
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}`}
        // This is added for Safari which would otherwise lead to focus loss
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        title={locales.rte.toolbar.bulletList}
        aria-label={locales.rte.toolbar.bulletList}
        type="button"
      >
        <UnorderedList />
      </button>
      <button
        className={`${baseButtonClassName} ${enabledClassName}`}
        // This is added for Safari which would otherwise lead to focus loss
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        title={locales.rte.toolbar.numberedList}
        aria-label={locales.rte.toolbar.numberedList}
        type="button"
      >
        <OrderedList />
      </button>
      <div>
        <button
          ref={showInsertLinkMenuButtonRef}
          className={`${baseButtonClassName} ${
            canInsertLink === true ? enabledClassName : disabledClassName
          }`}
          disabled={canInsertLink === false}
          // This is added for Safari which would otherwise lead to focus loss
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            editor.getEditorState().read(() => {
              const selection = $getSelection();
              let clonedSelection = null;
              if (selection !== null) {
                clonedSelection = selection.clone();
              }
              setLastValidSelection(clonedSelection);
              setShowInsertLinkMenu(!showInsertLinkMenu);
            });
          }}
          title={locales.rte.toolbar.link.title}
          aria-label={locales.rte.toolbar.link.title}
        >
          <LinkIcon />
        </button>
        <div className="mv-absolute mv-left-0 mv-max-w-1/2 mv-mt-1">
          <div
            className={`mv-bg-white mv-border-x mv-border-b mv-border-gray-200 mv-px-2 mv-pb-2 mv-rounded-br-lg ${
              showInsertLinkMenu
                ? "mv-block mv-opacity-100 mv-w-fit mv-h-fit"
                : "mv-fixed mv-opacity-0 mv-w-0 mv-h-0"
            }`}
          >
            <div className="mv-flex mv-gap-1 mv-items-center mv-abolute mv-top-0">
              <Input
                id={`link-input-${editor.getKey()}`}
                ref={linkInputRef}
                withoutName
                value={linkInputValue}
                onChange={(event) =>
                  setLinkInputValue(event.currentTarget.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    editor.update(() => {
                      if (lastValidSelection !== null) {
                        $setSelection(lastValidSelection);
                      }
                    });
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkInputValue);
                    setLinkInputValue("https://");
                    setShowInsertLinkMenu(false);
                  }
                }}
                disabled={showInsertLinkMenu === false}
              >
                <Input.Label htmlFor={`link-input-${editor.getKey()}`}>
                  {locales.rte.toolbar.link.cta}
                </Input.Label>
                <Input.Controls>
                  <Button
                    variant="outline"
                    onClick={() => {
                      editor.update(() => {
                        if (lastValidSelection !== null) {
                          $setSelection(lastValidSelection);
                        }
                      });
                      editor.dispatchCommand(
                        TOGGLE_LINK_COMMAND,
                        linkInputValue
                      );
                      setLinkInputValue("https://");
                      setShowInsertLinkMenu(false);
                    }}
                    title={locales.rte.toolbar.link.cta}
                    aria-label={locales.rte.toolbar.link.cta}
                    type="button"
                    disabled={showInsertLinkMenu === false}
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

function LoadingToolbar(props: { locales: RTELocales }) {
  const { locales } = props;
  const buttonClassName =
    "mv-appearance-none mv-w-fit mv-font-semibold mv-whitespace-nowrap mv-flex mv-items-center mv-justify-center mv-align-middle mv-text-center mv-rounded-lg mv-text-xs mv-p-2 mv-leading-4 mv-bg-neutral-50 mv-text-neutral-300";
  return (
    <div className="mv-flex mv-gap-1 mv-w-full mv-h-10 mv-items-center mv-border-b mv-border-gray-200 mv-pl-1">
      <button
        className={buttonClassName}
        disabled={true}
        title={locales.rte.toolbar.undo}
        aria-label={locales.rte.toolbar.undo}
        type="button"
      >
        <ArrowCounterClockwise />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title={locales.rte.toolbar.redo}
        aria-label={locales.rte.toolbar.redo}
        type="button"
      >
        <ArrowClockwise />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title={locales.rte.toolbar.bold}
        aria-label={locales.rte.toolbar.bold}
        type="button"
      >
        <Bold />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title={locales.rte.toolbar.italic}
        aria-label={locales.rte.toolbar.italic}
        type="button"
      >
        <Italic />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title={locales.rte.toolbar.underline}
        aria-label={locales.rte.toolbar.underline}
        type="button"
      >
        <Underline />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title={locales.rte.toolbar.bulletList}
        aria-label={locales.rte.toolbar.bulletList}
        type="button"
      >
        <UnorderedList />
      </button>
      <button
        className={buttonClassName}
        disabled={true}
        title={locales.rte.toolbar.numberedList}
        aria-label={locales.rte.toolbar.numberedList}
        type="button"
      >
        <OrderedList />
      </button>
      <div className="mv-group">
        <button
          className={`${buttonClassName}`}
          disabled={true}
          title={locales.rte.toolbar.link.title}
          aria-label={locales.rte.toolbar.link.title}
        >
          <LinkIcon />
        </button>
        <div className="mv-absolute mv-left-0 mv-max-w-1/2 mv-mt-1">
          <div className="group-has-[:checked]:mv-block mv-hidden mv-bg-white mv-border-x mv-border-b mv-border-gray-200 mv-px-2 mv-pb-2 mv-rounded-br-lg">
            <div className="mv-flex mv-gap-1 mv-items-center mv-abolute mv-top-0">
              <Input id="linkInput" disabled={true} defaultValue="https://">
                <Input.Label htmlFor="linkInput">
                  {locales.rte.toolbar.link.cta}
                </Input.Label>
                <Input.Controls>
                  <Button
                    disabled={true}
                    variant="outline"
                    title={locales.rte.toolbar.link.cta}
                    aria-label={locales.rte.toolbar.link.cta}
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

export { LoadingToolbar, ToolbarPlugin };
