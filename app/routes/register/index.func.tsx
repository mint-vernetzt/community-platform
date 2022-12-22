import type { Profile } from "@prisma/client";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "~/lib/utils/tests";

describe("user registration", () => {
  beforeEach(() => {
    // Reset the application state before each test. Example:
    // example: cy.visit("http://localhost:3000/reset");
    // cy.wait(500); // Wait for the reset to complete asynchronously
  });

  test("registers a new user", () => {
    cy.visit("http://localhost:3000/register");
    cy.findByLabelText("Vorname *").type("Peter");
    cy.findByLabelText("Nachname *").type("Holló");
    cy.findByLabelText("E-Mail *").type("hello@songsforthe.dev");
    cy.findByLabelText("Passwort *").type("password");
    cy.findByRole("checkbox").click();
    cy.findByText("Account registrieren").click();

    // Check state of the application after the form is submitted
    cy.url().should("eq", "http://localhost:3000/register?index");
    cy.findByText("Willkommen, Peter Holló!").should("exist");
    cy.findByText("Abmelden").should("exist");
  });

  after(async () => {
    try {
      const request = new Request(testURL);
      const response = new Response();

      const authClient = createServerClient(
        Cypress.env("SUPABASE_URL"),
        Cypress.env("SERVICE_ROLE_KEY"),
        { request, response }
      );

      const res = await authClient
        .from("profiles")
        .select("id")
        .eq("username", "peterhollo")
        .single();

      if (res.data !== null) {
        const profile: Profile = res.data; // TODO: fix type issue
        await authClient.from("profiles").delete().match({ id: profile.id });
        await authClient.auth.admin.deleteUser(profile.id);
      console.log("Successfully deleted user and profile");
    } else {
      throw new Error("Couldn't reset profiles and users.");
    }
  } catch (error) {
    console.error(error);
  }
});

export {};

