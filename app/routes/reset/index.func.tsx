import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "../lib/utils/tests";

describe("reset password", () => {
  let uid: string | undefined;
  let authClient: any;
  
  beforeAll(() => {
    const request = new Request(testURL);
    const response = new Response();
    authClient = createServerClient(
      Cypress.env("SUPABASE_URL"),
      Cypress.env("SERVICE_ROLE_KEY"),
      { request, response }
    );
  });  

  beforeEach(() => {
    // Reset the application state before each test. Example:
    // cy.visit("http://localhost:3000/reset");
    // cy.wait(500); // Wait for the reset to complete asynchronously
  });
  
  beforeEach(async () => {
    const email = "hello@songsforthe.dev";
    const password = "password";
    const firstName = "Peter";
    const lastName = "Holló";
    const termsAccepted = "on";
    const username = "peterhollo";

    const {
      data: { user },
      error,
    } = await authClient.auth.admin.createUser({
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

  test("send reset request", () => {
    cy.visit("http://localhost:3000/reset");
    cy.findByLabelText("E-Mail").type("hello@songsforthe.dev");
    cy.findByRole("button").click();
    cy.url().should("eq", "http://localhost:3000/reset?index");
    cy.findByText("hello@songsforthe.dev").should("exist");
  });

  after(async () => {
    try {
      if (uid !== undefined) {
        await authClient.from("profiles").delete().match({ id: uid });
        await authClient.auth.admin.deleteUser(uid);
      }
    } catch (error) {
      console.error(error);
    }
  });
});

export {};
