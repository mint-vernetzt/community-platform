import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "~/lib/utils/tests";

const request = new Request(testURL);
const response = new Response();

const authClient = createServerClient(
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
  } = await authClient.auth.admin.listUsers();
  let user = users.filter((user) => user.email === email)[0];

  if (user) {
    //    await supabase.from("profiles").delete().match({ id: user.id });
    await authClient.auth.admin.deleteUser(user.id);
  }

  const {
    data: { user: newUser },
    error,
  } = await authClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { firstName, lastName, username, termsAccepted },
  });

  if (newUser === null) {
    console.error(error);
    throw new Error("Couldn't create user.");
  }

  uid = newUser.id;
});

it("login", () => {
  //cy.task("isUserDeleted", { uid }).then((result) => console.log(result));
  cy.visit("http://localhost:3000/");
  cy.findByLabelText("E-Mail").type("hello@songsforthe.dev");
  cy.findByLabelText("Passwort").type("password");
  cy.findByText("Login").click();
  cy.url().should("eq", "http://localhost:3000/profile/peterhollo");

  cy.visit("http://localhost:3000/profile/peterhollo/delete");
  cy.url().should("eq", "http://localhost:3000/profile/peterhollo/delete");

  cy.get("#confirmedToken").type("wirklich löschen");
  cy.findByText("Profil entgültig löschen").click();

  cy.url().should(
    "eq",
    "http://localhost:3000/profile/peterhollo/delete/goodbye"
  );

  cy.findByRole("heading").contains("Good Bye");

  cy.visit("http://localhost:3000/explore");
});

after(async () => {
  if (uid !== undefined) {
    //    await supabase.from("profiles").delete().match({ id: uid });
    await authClient.auth.admin.deleteUser(uid);
  }
});

export {};
