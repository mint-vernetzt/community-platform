/**
 * @vitest-environment jsdom
 */
import { test } from "vitest";

/* 

Unit tests:

Loader:
- Redirects to /dashboard or login_redirect (if specified) on authenticated
- Does not throw an error when tokens aren't provided (We need to reach the client on first loader call to get the hash params)
- Throws correct error on setSession failure (TODO: not current behaviour)
- If the user is already registered with email (provider === "email")
? --> Question: How do we even get in this else if case? A user that already registered with email should also pass the condition in the if case above and with that skip the else if condition?
--> Change provider to "keycloak"
--> Redirect with correct alert to /dashboard or login_redirect (if specified)
--> The set-cookie header should be valid and the user is logged in
- If the user is already register via keycloak
? --> Current behaviour: profileVisibility relation is checked and created if not existent
? --> Expected behaviour: This is obsolete because profileVisibility should always already be created via the createProfile function on register/verify.tsx and auth/keycloak.callback.tsx
? --> Current behaviour: The provider is changed to "keycloak"
? --> Expected behaviour: The provider should already be set to "keycloak". No need to reset it.
--> Redirect without alert to /dashboard or login_redirect (if specified)
--> The set-cookie header should be valid and the user is logged in
- If the user isn't registered yet (first login)
--> Profile is created with the required relations (profileVisibility and notificationSettings)
--> The provider is changed to "keycloak"
--> Redirect without alert to /profile/$username or login_redirect (if specified)
--> The set-cookie header should be valid and the user is logged in

Functional tests:

- Resubmits to current route when token hash params are present
? - Submits to /login route when token hash params are missing (TODO: not current behaviour)
--> Current behaviour: stays on the route without submitting anywhere and renders nothing


*/

test.skip("TODO", async () => {});
