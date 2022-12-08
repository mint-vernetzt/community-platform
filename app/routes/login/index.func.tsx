import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "~/lib/utils/tests";

const request = new Request(testURL);
const response = new Response();

const supabaseClient = createServerClient(
  Cypress.env("SUPABASE_URL"),
  Cypress.env("SERVICE_ROLE_KEY"),
  { request, response }
);

let uid: string | undefined;

before(async () => {
  const email = "hello@songsforthe.dev";
  const password = "password";
  const firstName = "Peter";
  const lastName = "Holló";
  const termsAccepted = "on";
  const username = "peterhollo";

  const {
    data: { users },
  } = await supabaseClient.auth.admin.listUsers();
  let user = users.filter((user) => user.email === email)[0];

  if (!user) {
    const {
      data: { user: newUser },
      error,
    } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName, username, termsAccepted },
    });

    if (newUser === null) {
      console.error(error);
      throw new Error("Couldn't create user.");
    }

    user = newUser;
  }

  uid = user.id;
});

it("redirect after login", () => {
  cy.visit("http://localhost:3000/login");
  cy.findByLabelText("E-Mail").type("hello@songsforthe.dev");
  cy.findByLabelText("Passwort").type("password");
  cy.findByText("Login").click();
  cy.url().should("eq", "http://localhost:3000/");
});

after(async () => {
  if (uid !== undefined) {
    await supabaseClient.from("profiles").delete().match({ id: uid });
    await supabaseClient.auth.admin.deleteUser(uid);
  }
});

export {};
