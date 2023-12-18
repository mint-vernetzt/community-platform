import type { Profile } from "@prisma/client";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "~/lib/utils/tests";

it("register user", () => {
  // TODO: fix type issue
  // Globals of cypress and jest are conflicting
  // @ts-ignore
  cy.visit("http://localhost:3000/register");
  // @ts-ignore
  cy.findByLabelText("Vorname *").type("Peter");
  // @ts-ignore
  cy.findByLabelText("Nachname *").type("Holló");
  // @ts-ignore
  cy.findByLabelText("E-Mail *").type("hello@songsforthe.dev");
  // @ts-ignore
  cy.findByLabelText("Passwort *").type("password");
  // @ts-ignore
  cy.findByRole("checkbox").click();
  // @ts-ignore
  cy.findByText("Account registrieren").click();
  // @ts-ignore
  cy.url().should("eq", "http://localhost:3000/register?index");
});

// @ts-ignore
after(async () => {
  const request = new Request(testURL);
  const response = new Response();

  const authClient = createServerClient(
    // @ts-ignore
    Cypress.env("SUPABASE_URL"),
    // @ts-ignore
    Cypress.env("SERVICE_ROLE_KEY"),
    { request, response }
  );

  const res = await authClient
    .from("profiles")
    .select("id")
    .eq("username", "peterhollo")
    .single();

  if (res.data !== null) {
    // @ts-ignore
    const profile: Profile = res.data; // TODO: fix type issue
    await authClient.from("profiles").delete().match({ id: profile.id });
    await authClient.auth.admin.deleteUser(profile.id);
  } else {
    throw new Error("Couldn't reset profiles and users.");
  }
});

export {};
