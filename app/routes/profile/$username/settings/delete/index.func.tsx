import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "~/lib/utils/tests";

const request = new Request(testURL);
const response = new Response();

const authClient = createServerClient(
  // TODO: fix type issues
  // Globals of cypress and jest are conflicting
  // @ts-ignore
  Cypress.env("SUPABASE_URL"),
  // @ts-ignore
  Cypress.env("SERVICE_ROLE_KEY"),
  { request, response }
);

let uid: string | undefined;

// @ts-ignore
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
  // @ts-ignore
  cy.visit("http://localhost:3000/");
  // @ts-ignore
  cy.findByLabelText("E-Mail").type("hello@songsforthe.dev");
  // @ts-ignore
  cy.findByLabelText("Passwort").type("password");
  // @ts-ignore
  cy.findByText("Login").click();
  // @ts-ignore
  cy.url().should("eq", "http://localhost:3000/profile/peterhollo");

  // @ts-ignore
  cy.visit("http://localhost:3000/profile/peterhollo/delete");
  // @ts-ignore
  cy.url().should("eq", "http://localhost:3000/profile/peterhollo/delete");

  // @ts-ignore
  cy.get("#confirmedToken").type("wirklich löschen");
  // @ts-ignore
  cy.findByText("Profil entgültig löschen").click();

  // @ts-ignore
  cy.url().should(
    "eq",
    "http://localhost:3000/profile/peterhollo/delete/goodbye"
  );

  // @ts-ignore
  cy.findByRole("heading").contains("Good Bye");

  // @ts-ignore
  cy.visit("http://localhost:3000/explore");
});

// @ts-ignore
after(async () => {
  if (uid !== undefined) {
    //    await supabase.from("profiles").delete().match({ id: uid });
    await authClient.auth.admin.deleteUser(uid);
  }
});

export {};
