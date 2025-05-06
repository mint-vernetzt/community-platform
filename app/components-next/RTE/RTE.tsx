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
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $setSelection,
  SELECTION_CHANGE_COMMAND,
  type EditorThemeClasses,
  type LexicalEditor,
} from "lexical";
import React from "react";
import { useHydrated } from "remix-utils/use-hydrated";
import { DefaultValuePlugin } from "./plugins/DefaultValuePlugin";
import { MaxLengthPlugin } from "./plugins/MaxLengthPlugin";
import { LoadingToolbar, ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { InputForFormPlugin } from "./plugins/InputForFormPlugin";
import { type ProjectDetailsSettingsLocales } from "~/routes/project/$slug/settings/details.server";
import { type ProjectRequirementsSettingsLocales } from "~/routes/project/$slug/settings/requirements.server";
import { type GeneralOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/general.server";
import { type GeneralEventSettingsLocales } from "~/routes/event/$slug/settings/general.server";
import { type GeneralProfileSettingsLocales } from "~/routes/profile/$username/settings/general.server";

export type InputForFormProps = Omit<
  React.HTMLProps<HTMLInputElement>,
  "value" | "onChange" | "className" | "readOnly" | "tabIndex"
> & {
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
};

export type RTELocales =
  | GeneralProfileSettingsLocales
  | GeneralOrganizationSettingsLocales
  | ProjectDetailsSettingsLocales
  | ProjectRequirementsSettingsLocales
  | GeneralEventSettingsLocales;

function RTE(
  props: Omit<InputForFormProps, "contentEditableRef"> & {
    locales: RTELocales;
  }
) {
  const { defaultValue, placeholder, maxLength, locales, ...rest } = props;

  const editorRef = React.useRef<LexicalEditor | null>(null);
  const contentEditableRef = React.useRef<HTMLDivElement | null>(null);
  const isHydrated = useHydrated();

  const theme: EditorThemeClasses = {
    text: {
      bold: "mv-font-semibold",
      italic: "mv-italic",
      underline: "mv-underline mv-underline-offset-2",
    },
    link: "mv-text-primary mv-font-semibold hover:mv-underline active:mv-underline mv-underline-offset-2 mv-cursor-pointer",
    list: {
      ul: "mv-pl-8 mv-list-disc",
      ol: "mv-pl-8 mv-list-decimal",
    },
  };

  const initialConfig: InitialConfigType = {
    namespace: rest.id || "RTE",
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
    <>
      {isHydrated === false ? (
        <div
          title="Rich text editor is loading..."
          className="mv-w-full mv-h-[234px] mv-border mv-border-gray-200 mv-rounded-lg"
        >
          <LoadingToolbar locales={locales} />
        </div>
      ) : (
        <div
          onBlur={(event) => {
            if (editorRef.current !== null) {
              const currentTarget = event.currentTarget;
              const relatedTarget = event.relatedTarget;
              // Focus has moved outside the editor
              if (!currentTarget.contains(relatedTarget)) {
                editorRef.current.update(() => {
                  $setSelection(null);
                });
                editorRef.current.dispatchCommand(
                  SELECTION_CHANGE_COMMAND,
                  undefined
                );
              }
            }
          }}
          className="mv-relative mv-w-full mv-h-[234px] mv-border mv-border-gray-200 mv-rounded-lg focus-within:mv-ring-2 focus-within:mv-ring-blue-400 focus-within:mv-border-blue-400 active-within:mv-ring-2 active-within:mv-ring-blue-400 active-within:mv-border-blue-400"
        >
          <LexicalComposer initialConfig={initialConfig}>
            <EditorRefPlugin editorRef={editorRef} />
            <ToolbarPlugin locales={locales} />
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  ref={contentEditableRef}
                  className="mv-p-2 mv-rounded-bl-lg mv-rounded-br-lg mv-h-48 mv-w-full mv-overflow-y-scroll focus:mv-outline-none"
                  placeholder={
                    placeholder !== undefined ? (
                      <div className="mv-absolute mv-top-12 mv-left-2 mv-pointer-events-none">
                        {placeholder}
                      </div>
                    ) : null
                  }
                  aria-placeholder={placeholder || ""}
                  title={locales.rte.title}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <DefaultValuePlugin defaultValue={defaultValue} />
            <InputForFormPlugin
              {...rest}
              contentEditableRef={contentEditableRef}
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
            <MarkdownShortcutPlugin
              transformers={[UNORDERED_LIST, ORDERED_LIST]}
            />
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
                        title={locales.rte.remainingCharacters}
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
        </div>
      )}
    </>
  );
}

export { RTE };
