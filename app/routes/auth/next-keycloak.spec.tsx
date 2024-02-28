/**
 * @vitest-environment jsdom
 */
import { test } from "vitest";

/* 

Unit tests:

Loader:
- Throws correct error on signInWithOAuth failure
- Redirects to correct url on success
--> The url includes the login_redirect param if specified
? - Redirects to /dashboard on authenticated (TODO: not current behaviour)

Functional tests:

- The whole keycloak flow is working
--> Click on login or register with keycloak (mint-id)
--> Redirects to keycloak endpoint
--> Login or register on the endpoint
--> Redirects to keycloak.callback.tsx
--> User is logged
--> provider is set to "keycloak"
--> Redirect to /dashboard or login_redirect (if specified)
--> The cookie is set correctly (set-cookie header)
--> Alert is shown if user registered and isn't shown if user logged in

*/

test.skip("TODO", async () => {});
