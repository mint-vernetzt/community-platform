import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Cypress.env("SUPABASE_URL"),
  Cypress.env("SERVICE_ROLE_KEY")
);

let uid: string | undefined;

before(async () => {
  const email = "hello@songsforthe.dev";
  const password = "password";
  const firstName = "Peter";
  const lastName = "Holló";
  const termsAccepted = "on";
  const username = "peterhollo";

  const { data: userList } = await supabase.auth.api.listUsers();
  let user = userList?.filter((user) => user.email === email)[0];

  if (user) {
    //    await supabase.from("profiles").delete().match({ id: user.id });
    await supabase.auth.api.deleteUser(user.id);
  }

  const { user: newUser, error } = await supabase.auth.api.createUser({
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
  cy.visit("http://localhost:3000/login");
  cy.findByLabelText("E-Mail").type("hello@songsforthe.dev");
  cy.findByLabelText("Passwort").type("password");
  cy.findByText("Login").click();
  cy.url().should("eq", "http://localhost:3000/");

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
    await supabase.auth.api.deleteUser(uid);
  }
});

export {};
