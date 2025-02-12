/**
 * @vitest-environment jsdom
 */
import { test } from "vitest";

/* 

Unit tests:

Loader:
- Redirect to /dashboard on authenticated

Action:
- Returns correct error messages on validation failure
- Returns correct error message on terms not accepted
- Does not return "User already registered" error
- Returns actionData.success === true on register success or on "User already registered" error
? --> Trims the form input values and normalizes the email to lower case (TODO: Not current behaviour)
? --> Only login_redirect param to own domain should work (TODO: Not current behaviour)


Functional tests:

- Render test
- Register form works (success, failure, login_redirect searchParam)
--> submit with enter works
--> validation errors are rendered on the input fields (or on the form if global)
? --> After first validation the form is revalidated onChange and hides the errors on successful revalidation
? --> Only redirect param to own domain should work (TODO: Not current behaviour)
? --> E-Mail is sent (can we check this?)
? --> E-Mail is not send on "User already registered" (can we check this?)
? --> E-Mail verification link contains the correct login_redirect param if present
- All links work
--> Link to login ships along the login_redirect searchParam
--> Don't forget password reset link that is only rendered on actionData.success === true
? - No browser console warnings/errors

*/

test.skip("TODO", async () => {
  return;
});
