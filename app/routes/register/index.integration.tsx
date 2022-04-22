it("register user", () => {
  cy.visit("http://localhost:3000/register");
  cy.findByLabelText("Vorname *").type("Peter");
  cy.findByLabelText("Nachname *").type("Holló");
  cy.findByLabelText("E-Mail *").type("hello@songsforthe.dev");
  cy.findByLabelText("Passwort *").type("password");
  cy.findByRole("checkbox").click();
  cy.findByText("Account registrieren").click();
});

export {};
