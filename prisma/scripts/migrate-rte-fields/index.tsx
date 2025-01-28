import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  type InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, $insertNodes } from "lexical";
import React from "react";
import ReactDOMClient from "react-dom/client";
import ReactDOMServer from "react-dom/server";
// @ts-ignore
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

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = dirname(__filename);

async function getNewValueFromRTE(oldValue: string) {
  const promise = new Promise<string>((resolve, reject) => {
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
        React.useEffect(() => {
          return editor.update(() => {
            const root = $getRoot();
            root.clear();
            const parser = new DOMParser();
            const dom = parser.parseFromString(String(oldValue), "text/html");
            const nodes = $generateNodesFromDOM(editor, dom);
            $insertNodes(nodes);
          });
        }, [editor]);
        return null;
      };
      const InputForFormPlugin = (props: { oldValue: string }) => {
        const { oldValue } = props;
        const [editor] = useLexicalComposerContext();
        const [value, setValue] = React.useState(oldValue);
        const [isInitialized, setIsInitialized] = React.useState(false);
        React.useEffect(() => {
          return editor.registerUpdateListener(() => {
            editor.read(() => {
              const htmlString = $generateHtmlFromNodes(editor);
              if (htmlString === "<p><br></p>") {
                setValue("");
              } else {
                setValue(htmlString);
              }
            });
          });
        }, [editor]);
        React.useEffect(() => {
          if (isInitialized === false) {
            setIsInitialized(true);
          } else {
            window.dispatchEvent(new Event(EDITOR_VALUE_SET_EVENT));
          }
        }, [value, oldValue, isInitialized]);
        return <input id="rte-input" value={value} onChange={() => {}} />;
      };

      // Regex to detect URLs and email addresses
      const URL_REGEX =
        /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;
      const EMAIL_REGEX =
        /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

      return (
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <DefaultValuePlugin />
          <InputForFormPlugin oldValue={oldValue} />
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

    const serverRenderedHTML = ReactDOMServer.renderToString(<RTEComponent />);

    const dom = new JSDOM(
      `<!DOCTYPE html><div id="root">${serverRenderedHTML}</div>`
    );
    const window: Window = dom.window;
    const document: Document = window.document;

    global.window = dom.window;
    global.document = dom.window.document;
    global.DOMParser = dom.window.DOMParser;
    global.MutationObserver = dom.window.MutationObserver;
    global.Event = dom.window.Event;
    window.addEventListener(EDITOR_VALUE_SET_EVENT, () => {
      const inputElement = document.querySelector(
        "#rte-input"
      ) as HTMLInputElement | null;
      if (inputElement !== null) {
        resolve(inputElement.value);
      } else {
        reject(new Error("Could not find the input element."));
      }
    });
    const container = document.getElementById("root");
    if (container !== null) {
      ReactDOMClient.hydrateRoot(container, <RTEComponent />);
    } else {
      reject(new Error("Could not find the root element."));
    }
  });

  return promise;
}

// TODO: Iterate through all the fields that need to be changed in the database
async function main() {
  const old = {
    profiles: await prismaClient.profile.findMany({
      select: {
        id: true,
        bio: true,
      },
    }),
    organizations: await prismaClient.organization.findMany({
      select: {
        id: true,
        bio: true,
      },
    }),
    projects: await prismaClient.project.findMany({
      select: {
        id: true,
        idea: true,
        goals: true,
        implementation: true,
        furtherDescription: true,
        targeting: true,
        hints: true,
        timeframe: true,
        jobFillings: true,
        furtherJobFillings: true,
        furtherFinancings: true,
        technicalRequirements: true,
        furtherTechnicalRequirements: true,
        roomSituation: true,
        furtherRoomSituation: true,
      },
    }),
    events: await prismaClient.event.findMany({
      select: {
        id: true,
        description: true,
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

  // Send all rte fields through the new hydrated RTE component, which transforms the old HTML to the new HTML
  // Did each entity on its own to get typescript support. Typescript cannot resolve the type on the third nested for loop.
  for (const oldProfile of changes.old.profiles) {
    const { id, ...rteFields } = oldProfile;
    let newProfile = { ...oldProfile };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        const newValue = await getNewValueFromRTE(rteFields[typedRteField]);
        newProfile[typedRteField] = newValue;
      }
    }
    changes.new.profiles.push(newProfile);
  }

  for (const oldOrganization of changes.old.organizations) {
    const { id, ...rteFields } = oldOrganization;
    let newOrganization = { ...oldOrganization };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        const newValue = await getNewValueFromRTE(rteFields[typedRteField]);
        newOrganization[typedRteField] = newValue;
      }
    }
    changes.new.organizations.push(newOrganization);
  }

  for (const oldProject of changes.old.projects) {
    const { id, ...rteFields } = oldProject;
    let newProject = { ...oldProject };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        const newValue = await getNewValueFromRTE(rteFields[typedRteField]);
        newProject[typedRteField] = newValue;
      }
    }
    changes.new.projects.push(newProject);
  }

  for (const oldEvent of changes.old.events) {
    const { id, ...rteFields } = oldEvent;
    let newEvent = { ...oldEvent };
    for (const rteField in rteFields) {
      const typedRteField = rteField as keyof typeof rteFields;
      if (rteFields[typedRteField] !== null) {
        const newValue = await getNewValueFromRTE(rteFields[typedRteField]);
        newEvent[typedRteField] = newValue;
      }
    }
    changes.new.events.push(newEvent);
  }

  // Save changes in json file
  fs.writeJSON(`${__dirname}/changes.json`, changes, {
    spaces: 4,
    encoding: "utf8",
  });

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
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
