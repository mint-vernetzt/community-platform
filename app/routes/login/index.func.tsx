import { createServerClient } from "@supabase/auth-helpers-remix";

const request = new Request("");
const response = new Response();

const supabaseClient = createServerClient(
  Cypress.env("SUPABASE_URL"),
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU",
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
