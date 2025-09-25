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
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
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
import { useEffect, useRef, useState } from "react";

function ToolbarPlugin(props: { locales: RTELocales }) {
  const { locales } = props;
  const [editor] = useLexicalComposerContext();

  const linkInputRef = useRef<HTMLInputElement>(null);
  const [linkInputValue, setLinkInputValue] = useState("https://");
  const showInsertLinkMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [showInsertLinkMenu, setShowInsertLinkMenu] = useState(false);
  const [canInsertLink, setCanInsertLink] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);

  const baseButtonClassName =
    "appearance-none w-fit font-semibold whitespace-nowrap flex items-center justify-center align-middle text-center rounded-lg text-xs p-2 leading-4";
  const disabledClassName = "bg-neutral-50 text-neutral-300";
  const enabledClassName =
    "text-gray hover:text-gray-800 hover:bg-neutral-200 focus:text-gray-800 focus:bg-neutral-50 active:bg-neutral-100 focus:ring-2 focus:ring-blue-500";

  useEffect(() => {
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

  useEffect(() => {
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
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, isBoldActive, isItalicActive, isUnderlineActive]);

  return (
    <div className="flex gap-1 w-full h-10 items-center border-b border-gray-200 pl-1">
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
          isBoldActive ? " bg-neutral-200 hover:bg-neutral-300" : ""
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
          isItalicActive ? " bg-neutral-200 hover:bg-neutral-300" : ""
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
          isUnderlineActive ? " bg-neutral-200 hover:bg-neutral-300" : ""
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
              setShowInsertLinkMenu(!showInsertLinkMenu);
            });
          }}
          title={locales.rte.toolbar.link.title}
          aria-label={locales.rte.toolbar.link.title}
        >
          <LinkIcon />
        </button>
        <div className="absolute left-0 max-w-1/2 mt-1">
          <div
            className={`bg-white border-x border-b border-gray-200 px-2 pb-2 rounded-br-lg ${
              showInsertLinkMenu
                ? "block opacity-100 w-fit h-fit"
                : "fixed opacity-0 w-0 h-0"
            }`}
          >
            <div className="flex gap-1 items-center abolute top-0">
              <Input
                id={`link-input-${editor.getKey()}`}
                ref={linkInputRef}
                withoutName
                value={linkInputValue}
                onChange={(event) =>
                  setLinkInputValue(event.currentTarget.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    setLinkInputValue("https://");
                    setShowInsertLinkMenu(false);
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
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
    "appearance-none w-fit font-semibold whitespace-nowrap flex items-center justify-center align-middle text-center rounded-lg text-xs p-2 leading-4 bg-neutral-50 text-neutral-300";
  return (
    <div className="flex gap-1 w-full h-10 items-center border-b border-gray-200 pl-1">
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
      <div className="group">
        <button
          className={`${buttonClassName}`}
          disabled={true}
          title={locales.rte.toolbar.link.title}
          aria-label={locales.rte.toolbar.link.title}
        >
          <LinkIcon />
        </button>
        <div className="absolute left-0 max-w-1/2 mt-1">
          <div className="group-has-[:checked]:block hidden bg-white border-x border-b border-gray-200 px-2 pb-2 rounded-br-lg">
            <div className="flex gap-1 items-center abolute top-0">
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
