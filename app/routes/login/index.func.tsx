import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Cypress.env("SUPABASE_URL"),
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU"
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

  if (!user) {
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
    await supabase.from("profiles").delete().match({ id: uid });
    await supabase.auth.api.deleteUser(uid);
  }
});

export {};
