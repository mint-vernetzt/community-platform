import { createServerClient } from "@supabase/auth-helpers-remix";
import { testURL } from "~/lib/utils/tests";

const test = it;

describe("reset password", () => {
  const request = new Request(testURL);
  const response = new Response();

  const supabaseClient = createServerClient(
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
      data: { user },
      error,
    } = await supabaseClient.auth.admin.createUser({
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
    if (uid !== undefined) {
      await supabaseClient.from("profiles").delete().match({ id: uid });
      await supabaseClient.auth.admin.deleteUser(uid);
    }
  });
});

export {};
