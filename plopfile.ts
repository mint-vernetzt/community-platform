import { type NodePlopAPI } from "plop";

export default function (plop: NodePlopAPI) {
  plop.setGenerator("route", {
    description: "Create route",
    prompts: [
      {
        type: "input",
        name: "path",
        message:
          "Please type in the whole path. Include the filename at the end (e.g. /my/awesome/route.tsx, /my/$param/route.tsx, /my/param/$route.tsx, ...). The path is relative to the app/routes folder and starts with a trailing slash.",
        validate: (string) => {
          return string[0] === "/" && string[string.length - 1] !== "/";
        },
      },
      {
        type: "input",
        name: "componentName",
        message:
          "Please type in the capitalized component name (default: Index; e.g. Faq, Username, ...).",
        default: "Index",
      },
      {
        type: "confirm",
        name: "skipUnitTest",
        message: "Do you want to skip unit test?",
        default: false,
      },
      {
        type: "confirm",
        name: "skipFunctionalTest",
        message: "Do you want to skip functional test?",
        default: false,
      },
    ],
    actions: (data) => {
      let filePath;
      let typesPath;
      let componentName;
      let skipUnitTest;
      let skipFunctionalTest;
      if (typeof data === "undefined") {
        filePath = "app/routes/index.tsx";
        typesPath = "index";
        componentName = "Index";
        skipUnitTest = false;
        skipFunctionalTest = false;
      } else {
        filePath = `app/routes${String(data.path)}`;
        // Remove .tsx for type import statement
        typesPath = `${String(data.path.substring(0, data.path.length - 4))}`;
        componentName = `${String(data.fileName)
          .charAt(0)
          .toUpperCase()}${String(data.fileName).substring(1)}`;
        skipUnitTest = Boolean(data.skipUnitTest);
        skipFunctionalTest = Boolean(data.skipFunctionalTest);
      }
      const actions = [
        {
          type: "add",
          path: filePath,
          templateFile: "templates/route.txt",
          data: {
            componentName,
            typesPath,
          },
        },
      ];

      // TODO: Template does not exist yet (route.spec.txt)
      if (skipUnitTest === false) {
        actions.push({
          type: "add",
          path: filePath.replace(".tsx", ".spec.tsx"),
          templateFile: "templates/route.spec.txt",
          data: {
            componentName,
            typesPath,
          },
        });
      }

      // TODO: Template does not exist yet (route.func.txt)
      if (skipFunctionalTest === false) {
        actions.push({
          type: "add",
          path: filePath.replace(".tsx", ".func.tsx"),
          templateFile: "templates/route.func.txt",
          data: {
            componentName,
            typesPath,
          },
        });
      }
      return actions;
    },
  });

  plop.setGenerator("component", {
    description: "Create component",
    prompts: [
      {
        type: "input",
        name: "path",
        message:
          "Please type in the whole path. Include the filename at the end (e.g. /components-next/Input.tsx, /components/Avatar.tsx ...). The path is relative to the app folder and starts with a trailing slash.",
        default: "/components-next/MyComponent.tsx",
      },
      {
        type: "confirm",
        name: "skipTest",
        message: "Do you want to skip test?",
        default: false,
      },
    ],
    actions: (data) => {
      let skipTest;
      let filePath;
      if (typeof data === "undefined") {
        filePath = "app/components-next/MyComponent.tsx";
        skipTest = false;
      } else {
        filePath = `app${String(data.path)}`;
        skipTest = Boolean(data.skipTest);
      }

      const actions = [
        {
          type: "add",
          path: filePath,
          templateFile: "templates/component.txt",
        },
      ];
      if (skipTest === false) {
        // TODO: Template does not exist yet (component.spec.txt)
        actions.push({
          type: "add",
          path: filePath.replace(".tsx", ".spec.tsx"),
          templateFile: "templates/component.spec.txt",
        });
      }
      return actions;
    },
  });
}
