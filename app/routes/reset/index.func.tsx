import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "~/lib/utils/tests";

describe("reset password", () => {
  const request = new Request(testURL);
  const response = new Response();

  const authClient = createServerClient(
    // TODO: fix type issue
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

  it("send reset request", () => {
    // @ts-ignore
    cy.visit("http://localhost:3000/reset");
    // @ts-ignore
    cy.findByLabelText("E-Mail").type("hello@songsforthe.dev");
    // @ts-ignore
    cy.findByRole("button").click();
    // @ts-ignore
    cy.url().should("eq", "http://localhost:3000/reset?index");
    // @ts-ignore
    cy.findByText("hello@songsforthe.dev").should("exist");
  });

  // @ts-ignore
  after(async () => {
    if (uid !== undefined) {
      await authClient.from("profiles").delete().match({ id: uid });
      await authClient.auth.admin.deleteUser(uid);
    }
  });
});

export {};
