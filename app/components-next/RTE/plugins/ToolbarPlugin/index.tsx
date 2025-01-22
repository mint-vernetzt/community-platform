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
import { type RTELocales } from "../../RTE";

function ToolbarPlugin(props: { locales: RTELocales }) {
  const { locales } = props;
  const [editor] = useLexicalComposerContext();

  const linkInputRef = React.useRef<HTMLInputElement>(null);
  const [linkInputValue, setLinkInputValue] = React.useState("https://");
  const [showInsertLinkMenu, setShowInsertLinkMenu] = React.useState(false);
  const [canInsertLink, setCanInsertLink] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [isBoldActive, setIsBoldActive] = React.useState(false);
  const [isItalicActive, setIsItalicActive] = React.useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = React.useState(false);

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
    <div className="mv-flex mv-gap-1 mv-w-full mv-h-10 mv-items-center mv-border-b mv-border-gray-200 mv-pl-1">
      <button
        className={`${baseButtonClassName} ${
          canUndo === true ? enabledClassName : disabledClassName
        }`}
        disabled={canUndo === false}
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
        onClick={() => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        title={locales.rte.toolbar.numberedList}
        aria-label={locales.rte.toolbar.numberedList}
        type="button"
      >
        <OrderedList />
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
          />
          <label
            htmlFor="add-link"
            className={`${baseButtonClassName} ${
              canInsertLink === true ? enabledClassName : disabledClassName
            }`}
            onMouseDown={(event) => {
              // Prevent editor focus loss on click
              event.preventDefault();
            }}
            title={locales.rte.toolbar.link.title}
          >
            <LinkIcon />
          </label>
        </div>
        <div className="mv-absolute mv-left-0 mv-max-w-1/2 mv-mt-1">
          <div className="group-has-[:checked]:mv-block mv-hidden mv-bg-white mv-border-x mv-border-b mv-border-gray-200 mv-px-2 mv-pb-2 mv-rounded-br-lg">
            <div className="mv-flex mv-gap-1 mv-items-center mv-abolute mv-top-0">
              <Input
                id="linkInput"
                withoutName
                ref={linkInputRef}
                value={linkInputValue}
                onChange={(event) =>
                  setLinkInputValue(event.currentTarget.value)
                }
              >
                <Input.Label htmlFor="linkInput">
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
            title={locales.rte.toolbar.link.title}
          >
            <LinkIcon />
          </label>
        </div>
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

export { ToolbarPlugin, LoadingToolbar };
