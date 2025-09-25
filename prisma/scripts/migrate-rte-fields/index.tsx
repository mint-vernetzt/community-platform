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
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { prismaClient } from "~/prisma.server";
import fs from "fs-extra";

import { fileURLToPath } from "url";
import { dirname } from "path";
import { useEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { type InputForFormProps } from "~/components-next/RTE/RTE";
import { type UseFormRegisterReturn } from "react-hook-form";

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
            bold: "font-semibold",
            italic: "italic",
            underline: "underline underline-offset-2",
          },
          link: "text-primary font-semibold hover:underline active:underline underline-offset-2 cursor-pointer",
          list: {
            ul: "pl-8 list-disc",
            ol: "pl-8 list-decimal",
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
        const InputForFormPlugin = (
          props: InputForFormProps & {
            legacyFormRegister?: UseFormRegisterReturn<
              "bioRTEState" | "descriptionRTEState"
            >;
          }
        ) => {
          const { rteStateDefaultValue, contentEditableRef } = props;
          const [editor] = useLexicalComposerContext();
          const [editorStateInitialized, setEditorStateInitialized] =
            useState(false);

          useEffect(() => {
            // First init the editor state
            editor.update(
              () => {
                if (typeof rteStateDefaultValue === "string") {
                  const editorState =
                    editor.parseEditorState(rteStateDefaultValue);
                  if (editorState.isEmpty() === false) {
                    editor.setEditorState(editorState);
                  }
                }
                setEditorStateInitialized(true);
              },
              {
                discrete: true,
              }
            );
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, []);

          useEffect(() => {
            if (editorStateInitialized === false) {
              return;
            }

            // Second, synchronize the values of the inputs with the editor content on update
            // Dont ignore firstUpdate in the script
            // -> Different behaviour than in the app
            // let isFirstUpdate = true;
            const onEditorUpdate = () => {
              // if (isFirstUpdate) {
              //   isFirstUpdate = false;
              //   return; // Ignore the first update event
              // }
              let submissionHTMLValue = "";
              let submissionEditorStateJSON = "";
              if (contentEditableRef.current !== null) {
                editor.read(() => {
                  if (contentEditableRef.current !== null) {
                    const htmlString = contentEditableRef.current.innerHTML;
                    if (htmlString === "<p><br></p>") {
                      submissionHTMLValue = "";
                    } else {
                      submissionHTMLValue = htmlString.replaceAll(
                        /^(?:<p><br><\/p>)+|(?:<p><br><\/p>)+$/g,
                        ""
                      );
                    }
                  }
                });
              }
              editor.read(() => {
                const editorState = editor.getEditorState();
                const editorStateJSON = JSON.stringify(editorState.toJSON());
                submissionEditorStateJSON = editorStateJSON;
              });
              const event = new CustomEvent(EDITOR_VALUE_SET_EVENT, {
                detail: {
                  htmlValue: submissionHTMLValue,
                  editorStateValue: submissionEditorStateJSON,
                },
                bubbles: true,
                cancelable: false,
              });
              document.body.dispatchEvent(event);
            };
            // Trigger an editor update event for the script
            // -> Different behaviour than in the app
            editor.update(() => {
              const editorState = editor.getEditorState();
              editor.setEditorState(editorState);
            });
            return editor.registerUpdateListener(onEditorUpdate);
          }, [editorStateInitialized, contentEditableRef, editor]);

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
            <InputForFormPlugin
              htmlDefaultValue={oldHtmlValue || undefined}
              rteStateDefaultValue={oldRTEStateValue || undefined}
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
