// import { prismaClient } from "~/prisma.server";
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

// TODO: Iterate through all the fields that need to be changed in the database
async function main() {
  const EDITOR_VALUE_SET_EVENT = "editor-value-set-event";
  const defaultValues = [
    "<p>Test value thats not formed like lexical would form it</p>",
    "<p>Another test value</p>",
  ];
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
    onError: (error) => {
      console.error(error);
    },
  };

  for (const defaultValue of defaultValues) {
    const RTEComponent = () => {
      const DefaultValuePlugin = () => {
        const [editor] = useLexicalComposerContext();
        React.useEffect(() => {
          return editor.update(() => {
            const root = $getRoot();
            root.clear();
            const parser = new DOMParser();
            const dom = parser.parseFromString(
              String(defaultValue),
              "text/html"
            );
            const nodes = $generateNodesFromDOM(editor, dom);
            $insertNodes(nodes);
          });
        }, [editor]);
        return null;
      };
      const InputForFormPlugin = (props: { defaultValue: string }) => {
        const { defaultValue } = props;
        const [editor] = useLexicalComposerContext();
        const [value, setValue] = React.useState(defaultValue);
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
          if (value !== defaultValue) {
            window.dispatchEvent(new Event(EDITOR_VALUE_SET_EVENT));
          }
        }, [value, defaultValue]);
        return <input id="rte-input" value={value} onChange={() => {}} />;
      };

      return (
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <DefaultValuePlugin />
          <InputForFormPlugin defaultValue={defaultValue} />
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
      console.log("Editor value set!");
      const inputElement = document.querySelector(
        "#rte-input"
      ) as HTMLInputElement | null;
      if (inputElement !== null) {
        console.log(inputElement.value);
      } else {
        console.log("Could not find the input element.");
      }
    });

    const container = document.getElementById("root");
    if (container !== null) {
      console.log("Found root element. Trying to hydrate...");
      ReactDOMClient.hydrateRoot(container, <RTEComponent />);
    } else {
      console.log("Could not find the root element.");
    }
  }
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    // await prismaClient.$disconnect();
  });
