import "@testing-library/cypress/add-commands";

Cypress.Commands.overwrite(
  "type",
  (originalFn, subject, text, options = {}) => {
    options.delay = 0;
    return originalFn(subject, text, options);
  }
);
