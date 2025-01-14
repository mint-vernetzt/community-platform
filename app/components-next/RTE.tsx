import { CodeNode } from "@lexical/code";
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
import { QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import {
  type EditorState,
  type EditorThemeClasses,
  type LexicalEditor,
} from "lexical";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";

const theme: EditorThemeClasses = {
  text: {
    bold: "mv-font-semibold",
    italic: "mv-italic",
    underline: "mv-underline mv-underline-offset-1",
  },
  link: "mv-text-primary mv-font-semibold hover:mv-underline active:mv-underline mv-underline-offset-4",
  list: {
    ul: "mv-pl-8 mv-list-disc",
    ol: "mv-pl-8 mv-list-decimal",
  },
};

function onChange(
  editorState: EditorState,
  editor: LexicalEditor,
  tags: Set<string>
) {
  console.log("onChange", { editorState, editor, tags });
  // TODO: Transfer rich text content to text input for form submission
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

const URL_REGEX =
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    const textWithProtocol =
      text.startsWith("https://") === false &&
      text.startsWith("http://") === false
        ? `https://${text}`
        : text;
    return textWithProtocol;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];

export function validateUrl(url: string): boolean {
  const urlRegExp = new RegExp(URL_REGEX);
  const emailRegExp = new RegExp(EMAIL_REGEX);
  const isValidUrl =
    urlRegExp.test(url) &&
    (url.startsWith("http://") || url.startsWith("https://"));
  const isValidMailTo = emailRegExp.test(url) && url.startsWith("mailto:");
  return isValidUrl || isValidMailTo;
}

function RTE(props: {
  defaultValue: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const { defaultValue, placeholder, maxLength } = props;

  //   const [editor]: [LexicalEditor] = useLexicalComposerContext();

  const initialConfig: InitialConfigType = {
    namespace: "RTE",
    theme,
    nodes: [
      AutoLinkNode,
      ListNode,
      ListItemNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      HorizontalRuleNode,
      CodeNode,
      // HeadingNode,
      LinkNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      OverflowNode,
    ],
    onError,
  };

  return (
    <div className="mv-relative mv-w-full mv-h-24 mv-rounded-lg">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              defaultValue={removeHtmlTags(defaultValue)}
              className="mv-p-2 mv-rounded-lg mv-border mv-border-gray-300 mv-w-full mv-h-full mv-overflow-y-scroll"
            />
          }
          placeholder={
            placeholder !== undefined ? (
              <div className="mv-absolute mv-top-2 mv-left-2 mv-pointer-events-none">
                {placeholder}
              </div>
            ) : undefined
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={onChange} />
        <HistoryPlugin />
        <LinkPlugin
          validateUrl={validateUrl}
          attributes={{ target: "_blank", rel: "noreferrer" }}
        />
        <AutoLinkPlugin matchers={MATCHERS} />
        <ClickableLinkPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={[UNORDERED_LIST, ORDERED_LIST]} />
        <HorizontalRulePlugin />
        {maxLength !== undefined ? (
          <CharacterLimitPlugin
            charset="UTF-8"
            maxLength={maxLength}
            renderer={({ remainingCharacters }) => (
              <div className="mv-flex mv-w-full mv-mt-2 mv-justify-end">
                <div className="mv-text-sm mv-text-gray-700">
                  {maxLength - remainingCharacters}/{maxLength}
                </div>
              </div>
            )}
          />
        ) : null}
      </LexicalComposer>
    </div>
  );
}

export { RTE };
