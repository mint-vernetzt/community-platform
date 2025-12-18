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
import { HorizontalRuleNode } from "@lexical/extension";
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
import { useHydrated } from "remix-utils/use-hydrated";
import { MaxLengthPlugin } from "./plugins/MaxLengthPlugin";
import { LoadingToolbar, ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { InputForFormPlugin } from "./plugins/InputForFormPlugin";
import { type ProjectDetailsSettingsLocales } from "~/routes/project/$slug/settings/details.server";
import { type ProjectRequirementsSettingsLocales } from "~/routes/project/$slug/settings/requirements.server";
import { type GeneralOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/general.server";
import { type GeneralEventSettingsLocales } from "~/routes/event/$slug/settings/general.server";
import { type GeneralProfileSettingsLocales } from "~/routes/profile/$username/settings/general.server";
import { useRef } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";

export type InputForFormProps = Omit<
  React.HTMLProps<HTMLInputElement>,
  "value" | "onChange" | "className" | "readOnly" | "tabIndex"
> & {
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
  htmlDefaultValue: string;
  rteStateDefaultValue: string;
};

export type RTELocales =
  | GeneralProfileSettingsLocales
  | GeneralOrganizationSettingsLocales
  | ProjectDetailsSettingsLocales
  | ProjectRequirementsSettingsLocales
  | GeneralEventSettingsLocales
  | {
      rte: {
        title: string;
        remainingCharacters: string;
        placeholder: string;
        toolbar: {
          undo: string;
          redo: string;
          bold: string;
          italic: string;
          underline: string;
          strikethrough: string;
          link: {
            title: string;
            cta: string;
          };
          bulletList: string;
          numberedList: string;
        };
      };
    };

function RTE(
  props: Omit<InputForFormProps, "contentEditableRef"> & {
    locales: RTELocales;
    legacyFormRegister?: UseFormRegisterReturn<
      "bioRTEState" | "descriptionRTEState"
    >;
    isFormDirty?: boolean;
  }
) {
  const {
    htmlDefaultValue,
    rteStateDefaultValue,
    placeholder,
    maxLength,
    locales,
    legacyFormRegister,
    isFormDirty,
    ...rest
  } = props;

  const editorRef = useRef<LexicalEditor | null>(null);
  const contentEditableRef = useRef<HTMLDivElement | null>(null);
  const isHydrated = useHydrated();

  const theme: EditorThemeClasses = {
    text: {
      bold: "font-semibold",
      italic: "italic",
      underline: "underline underline-offset-2",
    },
    link: "text-primary font-semibold hover:underline active:underline underline-offset-2 cursor-pointer",
    list: {
      ul: "pl-8 list-disc",
      ol: "pl-8 list-decimal",
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
          className="w-full h-[234px] border border-gray-200 rounded-lg"
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
          className="relative w-full h-[234px] border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 active-within:ring-2 active-within:ring-blue-400 active-within:border-blue-400"
        >
          <LexicalComposer initialConfig={initialConfig}>
            <EditorRefPlugin editorRef={editorRef} />
            <ToolbarPlugin locales={locales} />
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  ref={contentEditableRef}
                  className="p-2 rounded-bl-lg rounded-br-lg h-48 w-full overflow-y-scroll focus:outline-hidden"
                  placeholder={
                    <div className="absolute top-12 left-2 pointer-events-none">
                      {placeholder || locales.rte.placeholder}
                    </div>
                  }
                  aria-placeholder={placeholder || ""}
                  title={locales.rte.title}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <InputForFormPlugin
              {...rest}
              legacyFormRegister={legacyFormRegister}
              htmlDefaultValue={htmlDefaultValue}
              rteStateDefaultValue={rteStateDefaultValue}
              contentEditableRef={contentEditableRef}
              isFormDirty={isFormDirty}
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
                    <div className="flex w-full mt-2 justify-end">
                      <div
                        className={`text-sm ${
                          remainingCharacters < 0
                            ? "text-negative-700"
                            : "text-neutral-700"
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
