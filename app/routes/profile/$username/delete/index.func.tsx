import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Cypress.env("SUPABASE_URL"),
  Cypress.env("SERVICE_ROLE_KEY")
);

console.log(
  "*****",
  Cypress.env("SUPABASE_URL"),
  Cypress.env("SERVICE_ROLE_KEY")
);

let uid: string | undefined;
const email = "hello@songsforthe.dev";
const password = "password";
const firstName = "Peter";
const lastName = "Holló";
const termsAccepted = "on";
const username = "peterhollo";

before(async () => {
  const { user, error } = await supabase.auth.api.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { firstName, lastName, username, termsAccepted },
  });

  if (user === null) {
    console.error(error);
    throw new Error("Couldn't create user.");
  }

  uid = user.id;
});

it("redirect after login", () => {
  cy.visit("http://localhost:3000/login");
  cy.findByLabelText("E-Mail").type("hello@songsforthe.dev");
  cy.findByLabelText("Passwort").type("password");
  cy.findByText("Login").click();
  cy.url().should("eq", "http://localhost:3000/login");
});

after(async () => {
  if (uid !== undefined) {
    await supabase.from("profiles").delete().match({ id: uid });
    await supabase.auth.api.deleteUser(uid);
  }
});

export {};
