const test = it;

describe("context", () => {
  test("opens route", () => {
    cy.visit("http://localhost:3000/reset/set-password?access_token=foobar");
  });
});

export {};
