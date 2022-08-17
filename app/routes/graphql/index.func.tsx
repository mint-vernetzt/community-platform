const test = it;

describe("context", () => {
  test("opens route", () => {
    cy.visit("http://localhost:3000/graphql");
  });
});

export {};
