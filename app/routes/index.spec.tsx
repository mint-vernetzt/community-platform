/**
 * @vitest-environment jsdom
 */
import { beforeAll, expect, test, vi } from "vitest";
import { prismaClient } from "~/__mocks__/prisma.server";
import { consoleError } from "./../../tests/setup/setup-test-env";
import { createServerClient } from "~/__mocks__/auth.server";
import { createRemixStub } from "@remix-run/testing";
import { default as LandingPageRoute, loader } from "./index";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "./../../tests/i18n-for-tests";

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

beforeAll(() => {
  process.env.FEATURE_FLAGS = "keycloak: some-profile-id";
});

test("Landing page is rendered without errors", async () => {
  createServerClient.auth.getSession.mockResolvedValue({
    data: {
      session: null,
    },
    error: null,
  });
  consoleError.mockImplementationOnce(() => {});
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
  await render(
    <I18nextProvider i18n={i18n}>
      <LandingPage initialEntries={[routeUrl]} />
    </I18nextProvider>
  );

  const heading = await screen.findByRole("heading", {
    level: 1,
  });
  expect(heading.innerHTML).toEqual("welcome");
});
