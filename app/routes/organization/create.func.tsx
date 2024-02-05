const test = it;

describe("context", () => {
  test("opens route", () => {
    // TODO: fix type issue
    // Globals of cypress and jest are conflicting
    // @ts-ignore
    cy.visit("http://localhost:3000/organization/create");
  });
});

export {};
