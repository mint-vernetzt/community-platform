module.exports = function (
  /** @type {import('plop').NodePlopAPI} */
  plop
) {
  plop.setGenerator("route", {
    description: "Create route",
    prompts: [
      {
        type: "input",
        name: "path",
        message: "Please type in the whole path (e.g. /my/awesome/route).",
        validate: (string) => {
          return string[0] === "/" && string[string.length - 1] !== "/";
        },
      },
      {
        type: "input",
        name: "fileName",
        message: "Please type in file name (default: index ).",
        default: "index",
      },
      {
        type: "confirm",
        name: "isParameter",
        message: "Is this a route with parameter?",
        when: (answers) => {
          return answers.fileName !== "index";
        },
        default: false,
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
      let filePath = "app/routes{{ path }}/{{ fileName }}.tsx";
      let fileName = data.fileName;

      if (data.isParameter) {
        // eslint-disable-next-line no-template-curly-in-string
        filePath = "app/routes{{ path }}/${{ fileName }}.tsx";
      }

      const componentName = data.fileName;

      let route = data.path;

      if (data.fileName !== "index" && !data.isParameter) {
        route = `${route}/${fileName}`;
      }

      const actions = [
        {
          type: "add",
          path: filePath,
          templateFile: "templates/route.txt",
          data: {
            componentName,
          },
        },
      ];

      if (!data.skipUnitTest) {
        actions.push({
          type: "add",
          path: filePath.replace(".tsx", ".spec.tsx"),
          templateFile: data.isParameter
            ? "templates/$route.spec.txt"
            : "templates/route.spec.txt",
          data: {
            fileName,
            route,
            componentName,
          },
        });
      }

      if (!data.skipUnitTest) {
        actions.push({
          type: "add",
          path: filePath.replace(".tsx", ".func.tsx"),
          templateFile: data.isParameter
            ? "templates/$route.func.txt"
            : "templates/route.func.txt",
          data: {
            fileName,
            route,
            componentName,
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
        name: "componentName",
        message: "Please type in the component name (e.g. MyComponent ).",
        default: "MyComponent",
      },
      {
        type: "confirm",
        name: "skipTest",
        message: "Do you want to skip test?",
        default: false,
      },
      {
        type: "confirm",
        name: "skipStories",
        message: "Do you want to skip stories?",
        default: false,
      },
    ],
    actions: (data) => {
      const actions = [
        {
          type: "add",
          path: "app/components/{{pascalCase componentName}}/{{pascalCase componentName}}.tsx",
          templateFile: "templates/component.txt",
        },
      ];
      if (!data.skipTest) {
        actions.push({
          type: "add",
          path: "app/components/{{pascalCase componentName}}/{{pascalCase componentName}}.spec.tsx",
          templateFile: "templates/component.spec.txt",
        });
      }
      if (!data.skipStories) {
        actions.push({
          type: "add",
          path: "app/components/{{pascalCase componentName}}/{{pascalCase componentName}}.stories.tsx",
          templateFile: "templates/component.stories.txt",
        });
      }
      return actions;
    },
  });

  plop.setGenerator("test", {
    description: "Create component test",
    prompts: [
      {
        type: "input",
        name: "componentsFolder",
        message:
          "Please type in the path of your components folder (default: app/components).",
        default: "app/components",
      },
      {
        type: "input",
        name: "componentName",
        message: "Please type in the component name (e.g. MyComponent).",
        default: "MyComponent",
      },
    ],
    actions: [
      {
        type: "add",
        path: "{{componentsFolder}}/{{pascalCase componentName}}/{{pascalCase componentName}}.spec.tsx",
        templateFile: "templates/component.spec.txt",
      },
    ],
  });

  plop.setGenerator("stories", {
    description: "Create component stories",
    prompts: [
      {
        type: "input",
        name: "componentsFolder",
        message:
          "Please type in the path of your components folder (default: app/components).",
        default: "app/components",
      },
      {
        type: "input",
        name: "componentName",
        message: "Please type in the component name (e.g. MyComponent).",
        default: "MyComponent",
      },
    ],
    actions: [
      {
        type: "add",
        path: "{{componentsFolder}}/{{pascalCase componentName}}/{{pascalCase componentName}}.stories.tsx",
        templateFile: "templates/component.stories.txt",
      },
    ],
  });
};
