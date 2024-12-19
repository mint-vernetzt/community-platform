/**
 * @vitest-environment jsdom
 */
import { createRemixStub } from "@remix-run/testing";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { createServerClient } from "~/__mocks__/auth.server";
import { prismaClient } from "~/__mocks__/prisma.server";
import { consoleError } from "./../../tests/setup-test-env";
import { default as LandingPageRoute, loader } from "./index";
import { AuthError } from "@supabase/supabase-js";

/* 

Unit tests:

Loader:
- Redirect to /dashboard on authenticated
- Returns correct data structure

Action:
- Returns correct error messages on validation failure
- Returns correct error message and no set-cookie header on login failure
- Throws profile not found when profile === null (TODO: Not current behaviour)
- Redirects to dashboard with correct set-cookie header on login success
- Redirects to loginRedirect on login success with loginRedirect as form value
? --> Only redirect param to own domain should work (TODO: Not current behaviour)
? --> Trims the form input values and normalizes the email to lower case (TODO: Not current behaviour)


Functional tests:

- Render test
- Login form works (success, failure, login_redirect searchParam)
--> submit with enter works
--> validation errors are rendered on the input fields (or on the form if global)
? --> After first validation the form is revalidated onChange and hides the errors on successful revalidation
? --> Only redirect param to own domain should work (TODO: Not current behaviour)
- All links work
--> Link to register and reset password also ship along the login_redirect searchParam
- Scroll to intro section works
? - MINT-ID works (Only check correct redirect on "Anmelden mit MINT-ID" and "MINT-ID erstellen"?)
? - Entity counter are functional
? - No browser console warnings/errors

*/

vi.mock("~/prisma.server");

test("Landing page is rendered without errors", async () => {
  consoleError.mockImplementationOnce(() => {});
  consoleError.mockImplementationOnce(() => {});
  createServerClient.auth.getUser.mockResolvedValue({
    data: {
      user: null,
    },
    error: new AuthError("No session or session user found"),
  });
  prismaClient.profile.count.mockResolvedValue(20);
  prismaClient.organization.count.mockResolvedValue(20);
  prismaClient.event.count.mockResolvedValue(20);
  prismaClient.project.count.mockResolvedValue(20);

  const LandingPage = createRemixStub([
    {
      path: "/",
      Component: LandingPageRoute,
      loader,
    },
  ]);

  const routeUrl = `/`;
  await render(<LandingPage initialEntries={[routeUrl]} />);

  const heading = await screen.findByRole("heading", {
    level: 1,
  });
  console.log(heading.innerHTML);
  expect(heading.innerHTML).toEqual("Willkommen in Deiner MINT-Community");
});
