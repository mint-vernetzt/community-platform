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
          return string[0] === "/";
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
        default: false,
      },
    ],
    actions: (data) => {
      let path = "app/routes{{ path }}/{{ fileName }}.tsx";
      if (data.isParameter) {
        // eslint-disable-next-line no-template-curly-in-string
        path = "app/routes{{ path }}/${{ fileName }}.tsx";
      }
      return [
        {
          type: "add",
          path,
          templateFile: "templates/route.txt",
        },
      ];
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
        message: "Do you want to skip test.",
        default: false,
      },
      {
        type: "confirm",
        name: "skipStories",
        message: "Do you want to skip stories.",
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
          "Please type in the path of your components folder (default: app/components  ).",
        default: "app/components",
      },
      {
        type: "input",
        name: "componentName",
        message: "Please type in the component name (e.g. MyComponent ).",
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
          "Please type in the path of your components folder (default: app/components  ).",
        default: "app/components",
      },
      {
        type: "input",
        name: "componentName",
        message: "Please type in the component name (e.g. MyComponent ).",
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
