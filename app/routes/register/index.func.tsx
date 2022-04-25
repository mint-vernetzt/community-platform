import { Profile } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

it("register user", () => {
  cy.visit("http://localhost:3000/register");
  cy.findByLabelText("Vorname *").type("Peter");
  cy.findByLabelText("Nachname *").type("Holló");
  cy.findByLabelText("E-Mail *").type("hello@songsforthe.dev");
  cy.findByLabelText("Passwort *").type("password");
  cy.findByRole("checkbox").click();
  cy.findByText("Account registrieren").click();
  cy.wait(1000);
});

after(async () => {
  const supabaseClient = createClient(
    Cypress.env("SUPABASE_URL"),
    Cypress.env("SERVICE_ROLE_KEY")
  );

  const res = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("username", "peterhollo")
    .single();

  if (res.data !== null) {
    const profile: Profile = res.data;
    await supabaseClient.from("profiles").delete().match({ id: profile.id });
    await supabaseClient.auth.api.deleteUser(profile.id);
  } else {
    throw new Error("Couldn't reset profiles and users.");
  }
});

export {};
