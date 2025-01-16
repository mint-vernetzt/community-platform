import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { ORDERED_LIST, UNORDERED_LIST } from "@lexical/markdown";
import { OverflowNode } from "@lexical/overflow";
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from "@lexical/react/LexicalAutoLinkPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import {
  type InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  type EditorState,
  type EditorThemeClasses,
  type LexicalEditor,
} from "lexical";
import { MaxLengthPlugin } from "./plugins/MaxLengthPlugin";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { DefaultValuePlugin } from "./plugins/DefaultValuePlugin";
import { $generateHtmlFromNodes } from "@lexical/html";
import React from "react";

const theme: EditorThemeClasses = {
  text: {
    bold: "mv-font-semibold",
    italic: "mv-italic",
    underline: "mv-underline mv-underline-offset-2",
  },
  link: "mv-text-primary mv-font-semibold hover:mv-underline active:mv-underline mv-underline-offset-4 mv-cursor-pointer",
  list: {
    ul: "mv-pl-8 mv-list-disc",
    ol: "mv-pl-8 mv-list-decimal",
  },
};

function RTE(
  props: Omit<
    React.HTMLProps<HTMLTextAreaElement>,
    "value" | "onChange" | "className"
  >
) {
  const { id, defaultValue, placeholder, maxLength, ...rest } = props;

  const [textAreaValue, setTextAreaValue] = React.useState(defaultValue);

  const initialConfig: InitialConfigType = {
    namespace: "RTE",
    theme,
    nodes: [
      AutoLinkNode,
      ListNode,
      ListItemNode,
      HorizontalRuleNode,
      LinkNode,
      OverflowNode,
    ],
    onError: (error) => {
      console.error(error);
    },
  };

  // Regex to detect URLs and email addresses
  const URL_REGEX =
    /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;
  const EMAIL_REGEX =
    /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

  return (
    <div className="mv-relative mv-w-full mv-rounded-lg">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="mv-p-2 mv-rounded-bl-lg mv-rounded-br-lg mv-h-24 mv-border mv-border-gray-200 mv-w-full mv-overflow-y-scroll"
              placeholder={
                placeholder !== undefined ? (
                  <div className="mv-absolute mv-top-12 mv-left-2 mv-pointer-events-none">
                    {placeholder}
                  </div>
                ) : null
              }
              aria-placeholder={placeholder || ""}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <DefaultValuePlugin defaultValue={String(defaultValue)} />
        <OnChangePlugin
          onChange={(
            _editorState: EditorState,
            editor: LexicalEditor,
            _tags: Set<string>
          ) => {
            editor.read(() => {
              const htmlString = $generateHtmlFromNodes(editor);
              const textAreaValue =
                htmlString === "<p><br></p>" ? "" : `<div>${htmlString}</div>`;
              setTextAreaValue(textAreaValue);
            });
          }}
        />
        <HistoryPlugin />
        <LinkPlugin
          validateUrl={(url: string) => {
            const urlRegExp = new RegExp(URL_REGEX);
            const emailRegExp = new RegExp(EMAIL_REGEX);
            const isValidUrl =
              urlRegExp.test(url) &&
              (url.startsWith("http://") || url.startsWith("https://"));
            const isValidMailTo =
              emailRegExp.test(url) && url.startsWith("mailto:");
            return isValidUrl || isValidMailTo;
          }}
          attributes={{ target: "_blank", rel: "noopener noreferrer" }}
        />
        <AutoLinkPlugin
          matchers={[
            createLinkMatcherWithRegExp(URL_REGEX, (text) => {
              return text.startsWith("http") ? text : `https://${text}`;
            }),
            createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
              return `mailto:${text}`;
            }),
          ]}
        />
        <ClickableLinkPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={[UNORDERED_LIST, ORDERED_LIST]} />
        <HorizontalRulePlugin />
        {maxLength !== undefined ? (
          <>
            <CharacterLimitPlugin
              charset="UTF-8"
              maxLength={maxLength}
              renderer={({ remainingCharacters }) => (
                <div className="mv-flex mv-w-full mv-mt-2 mv-justify-end">
                  <div
                    className={`mv-text-sm ${
                      remainingCharacters < 0
                        ? "mv-text-red-500"
                        : "mv-text-gray-700"
                    }`}
                  >
                    {maxLength - remainingCharacters}/{maxLength}
                  </div>
                </div>
              )}
            />
            <MaxLengthPlugin maxLength={maxLength} />
          </>
        ) : null}
      </LexicalComposer>
      <textarea
        {...rest}
        id={id}
        value={textAreaValue}
        onChange={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className="hidden"
      ></textarea>
    </div>
  );
}

export { RTE };
