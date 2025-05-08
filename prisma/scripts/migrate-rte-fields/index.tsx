import {
  type InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -> This package is not typed
import { JSDOM } from "jsdom";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from "@lexical/react/LexicalAutoLinkPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { OverflowNode } from "@lexical/overflow";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ORDERED_LIST, UNORDERED_LIST } from "@lexical/markdown";
import { $generateNodesFromDOM } from "@lexical/html";
import { $insertNodes } from "lexical";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { prismaClient } from "~/prisma.server";
import fs from "fs-extra";

import { fileURLToPath } from "url";
import { dirname } from "path";
import { useEffect, useRef } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

async function getNewValueFromRTE(options: {
  oldHtmlValue: string | null;
  oldRTEStateValue: string | null;
}) {
  const { oldHtmlValue, oldRTEStateValue } = options;
  const promise = new Promise<string | Error>((resolve, reject) => {
    try {
      const EDITOR_VALUE_SET_EVENT = "editor-value-set-event";
      const initialConfig: InitialConfigType = {
        namespace: "RTE",
        theme: {
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
        },
        nodes: [
          AutoLinkNode,
          ListNode,
          ListItemNode,
          HorizontalRuleNode,
          LinkNode,
          OverflowNode,
        ],
        onError: (error) => {
          reject(error);
        },
      };
      const RTEComponent = () => {
        const DefaultValuePlugin = () => {
          const [editor] = useLexicalComposerContext();
          useEffect(() => {
            return editor.update(() => {
              if (oldRTEStateValue !== null && oldRTEStateValue !== "") {
                console.log("DefaultValuePlugin - Old RTE State Value", {
                  oldRTEStateValue,
                });
                const editorState = editor.parseEditorState(oldRTEStateValue);
                editor.setEditorState(editorState);
              } else {
                if (
                  oldHtmlValue !== null &&
                  oldHtmlValue !== "" &&
                  oldHtmlValue !== "<p><br></p>"
                ) {
                  const parser = new DOMParser();
                  const dom = parser.parseFromString(
                    String(oldHtmlValue),
                    "text/html"
                  );
                  const nodes = $generateNodesFromDOM(editor, dom);
                  $insertNodes(nodes);
                } else {
                  $insertNodes([]);
                }
              }
            });
          }, [editor]);
          return null;
        };
        const InputForFormPlugin = (props: {
          oldHtmlInputValue: string | null;
          oldRTEStateInputValue: string | null;
          contentRef: React.RefObject<HTMLDivElement | null>;
        }) => {
          const { contentRef } = props;
          const [editor] = useLexicalComposerContext();
          useEffect(() => {
            return editor.registerUpdateListener(() => {
              if (contentRef.current !== null) {
                editor.read(() => {
                  if (contentRef.current !== null) {
                    const htmlString =
                      contentRef.current.innerHTML === "<p><br></p>" ||
                      contentRef.current.innerHTML === ""
                        ? null
                        : contentRef.current.innerHTML;
                    const editorState = editor.getEditorState();
                    const editorStateJSON = JSON.stringify(editorState);
                    const event = new CustomEvent(EDITOR_VALUE_SET_EVENT, {
                      detail: {
                        htmlValue: htmlString,
                        editorStateValue: editorStateJSON,
                      },
                      bubbles: true,
                      cancelable: false,
                    });
                    document.body.dispatchEvent(event);
                  }
                });
              }
            });
          }, [editor, contentRef]);

          return null;
        };
        const contentEditableRef = useRef<HTMLDivElement | null>(null);

        // Regex to detect URLs and email addresses
        const URL_REGEX =
          /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;
        const EMAIL_REGEX =
          /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

        return (
          <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
              contentEditable={<ContentEditable ref={contentEditableRef} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <DefaultValuePlugin />
            <InputForFormPlugin
              oldHtmlInputValue={oldHtmlValue}
              oldRTEStateInputValue={oldRTEStateValue}
              contentRef={contentEditableRef}
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
          </LexicalComposer>
        );
      };

      const serverRenderedHTML = renderToString(<RTEComponent />);

      const dom = new JSDOM(
        `<!DOCTYPE html><div id="root">${serverRenderedHTML}</div>`
      );
      const window: Window = dom.window;
      const document: Document = window.document;

      global.window = dom.window;
      global.document = dom.window.document;
      global.DOMParser = dom.window.DOMParser;
      global.MutationObserver = dom.window.MutationObserver;
      global.CustomEvent = dom.window.CustomEvent;
      window.addEventListener(EDITOR_VALUE_SET_EVENT, (event) => {
        console.log("Successfully hydrated RTE and read its values");
        resolve(
          JSON.stringify({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            htmlValue: event.detail.htmlValue,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            editorStateValue: event.detail.editorStateValue,
          })
        );
      });
      const container = document.getElementById("root");
      if (container !== null) {
        hydrateRoot(container, <RTEComponent />);
      } else {
        reject(new Error("Could not find the root element."));
      }
    } catch (error) {
      if (error instanceof Error) {
        reject(error);
      } else {
        reject(new Error("An unknown error occurred."));
      }
    }
  });
  return promise;
}

async function main() {
  console.log("\nCollecting old RTE fields...                       [x---]");
  const old = {
    profiles: await prismaClient.profile.findMany({
      select: {
        id: true,
        bio: true,
        bioRTEState: true,
      },
    }),
    organizations: await prismaClient.organization.findMany({
      select: {
        id: true,
        bio: true,
        bioRTEState: true,
      },
    }),
    projects: await prismaClient.project.findMany({
      select: {
        id: true,
        idea: true,
        ideaRTEState: true,
        goals: true,
        goalsRTEState: true,
        implementation: true,
        implementationRTEState: true,
        furtherDescription: true,
        furtherDescriptionRTEState: true,
        targeting: true,
        targetingRTEState: true,
        hints: true,
        hintsRTEState: true,
        timeframe: true,
        timeframeRTEState: true,
        jobFillings: true,
        jobFillingsRTEState: true,
        furtherJobFillings: true,
        furtherJobFillingsRTEState: true,
        furtherFinancings: true,
        furtherFinancingsRTEState: true,
        technicalRequirements: true,
        technicalRequirementsRTEState: true,
        furtherTechnicalRequirements: true,
        furtherTechnicalRequirementsRTEState: true,
        roomSituation: true,
        roomSituationRTEState: true,
        furtherRoomSituation: true,
        furtherRoomSituationRTEState: true,
      },
    }),
    events: await prismaClient.event.findMany({
      select: {
        id: true,
        description: true,
        descriptionRTEState: true,
      },
    }),
  };
  const changes: {
    old: typeof old;
    new: typeof old;
  } = {
    old,
    new: {
      profiles: [],
      organizations: [],
      projects: [],
      events: [],
    },
  };

  console.log("Running RTE fields through hydrated lexical RTE... [xx--]");
  // Send all rte fields through the new hydrated RTE component, which transforms the old HTML to the new HTML
  // Did each entity on its own to get typescript support. Typescript cannot resolve the type on the third nested for loop.
  for (const oldProfile of changes.old.profiles) {
    const { id, ...rteFields } = oldProfile;
    const newProfile = { ...oldProfile };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (typedRteField.endsWith("RTEState") === false) {
        const newValue = await getNewValueFromRTE({
          oldHtmlValue: rteFields[typedRteField],
          oldRTEStateValue:
            rteFields[`${typedRteField}RTEState` as keyof typeof rteFields],
        });
        if (newValue instanceof Error) {
          console.error(
            `Skipped field ${typedRteField} for profile ${id} because of following error: ${newValue.message}`
          );
        } else {
          const result: {
            htmlValue: string;
            editorStateValue: string;
          } = JSON.parse(newValue);
          newProfile[typedRteField] =
            result.htmlValue === "" ? null : result.htmlValue;
          newProfile[`${typedRteField}RTEState` as keyof typeof rteFields] =
            result.editorStateValue;
        }
      }
    }
    changes.new.profiles.push(newProfile);
  }

  for (const oldOrganization of changes.old.organizations) {
    const { id, ...rteFields } = oldOrganization;
    const newOrganization = { ...oldOrganization };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (typedRteField.endsWith("RTEState") === false) {
        const newValue = await getNewValueFromRTE({
          oldHtmlValue: rteFields[typedRteField],
          oldRTEStateValue:
            rteFields[`${typedRteField}RTEState` as keyof typeof rteFields],
        });
        if (newValue instanceof Error) {
          console.error(
            `Skipped field ${typedRteField} for profile ${id} because of following error: ${newValue.message}`
          );
        } else {
          const result: {
            htmlValue: string;
            editorStateValue: string;
          } = JSON.parse(newValue);
          newOrganization[typedRteField] =
            result.htmlValue === "" ? null : result.htmlValue;
          newOrganization[
            `${typedRteField}RTEState` as keyof typeof rteFields
          ] = result.editorStateValue;
        }
      }
    }
    changes.new.organizations.push(newOrganization);
  }

  for (const oldProject of changes.old.projects) {
    const { id, ...rteFields } = oldProject;
    const newProject = { ...oldProject };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (typedRteField.endsWith("RTEState") === false) {
        const newValue = await getNewValueFromRTE({
          oldHtmlValue: rteFields[typedRteField],
          oldRTEStateValue:
            rteFields[`${typedRteField}RTEState` as keyof typeof rteFields],
        });
        if (newValue instanceof Error) {
          console.error(
            `Skipped field ${typedRteField} for profile ${id} because of following error: ${newValue.message}`
          );
        } else {
          const result: {
            htmlValue: string;
            editorStateValue: string;
          } = JSON.parse(newValue);
          newProject[typedRteField] =
            result.htmlValue === "" ? null : result.htmlValue;
          newProject[`${typedRteField}RTEState` as keyof typeof rteFields] =
            result.editorStateValue;
        }
      }
    }
    changes.new.projects.push(newProject);
  }

  for (const oldEvent of changes.old.events) {
    const { id, ...rteFields } = oldEvent;
    const newEvent = { ...oldEvent };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (typedRteField.endsWith("RTEState") === false) {
        const newValue = await getNewValueFromRTE({
          oldHtmlValue: rteFields[typedRteField],
          oldRTEStateValue:
            rteFields[`${typedRteField}RTEState` as keyof typeof rteFields],
        });
        if (newValue instanceof Error) {
          console.error(
            `Skipped field ${typedRteField} for profile ${id} because of following error: ${newValue.message}`
          );
        } else {
          const result: {
            htmlValue: string;
            editorStateValue: string;
          } = JSON.parse(newValue);
          newEvent[typedRteField] =
            result.htmlValue === "" ? null : result.htmlValue;
          newEvent[`${typedRteField}RTEState` as keyof typeof rteFields] =
            result.editorStateValue;
        }
      }
    }
    changes.new.events.push(newEvent);
  }

  console.log("Writing changes JSON...                            [xxx-]");
  // Save changes in json file
  const currentTimestamp = new Date().toISOString();
  // eslint-disable-next-line import/no-named-as-default-member
  fs.writeJSON(`${__dirname}/changes_${currentTimestamp}.json`, changes, {
    spaces: 4,
    encoding: "utf8",
  });

  console.log("Updating RTE fields in db to new values...         [xxxx]");
  // Save new values in the database
  for (const newProfile of changes.new.profiles) {
    const { id, ...rteFields } = newProfile;
    await prismaClient.profile.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const newOrganization of changes.new.organizations) {
    const { id, ...rteFields } = newOrganization;
    await prismaClient.organization.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const newProject of changes.new.projects) {
    const { id, ...rteFields } = newProject;
    await prismaClient.project.update({
      where: { id },
      data: rteFields,
    });
  }
  for (const newEvent of changes.new.events) {
    const { id, ...rteFields } = newEvent;
    await prismaClient.event.update({
      where: { id },
      data: rteFields,
    });
  }
  console.log("\nMigrated RTE fields successfully");
  console.log("For changes see ./changes.json");
  console.log("For rollback see ./rollback.ts");
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
