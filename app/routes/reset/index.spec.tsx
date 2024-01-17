/* 

Unit tests:

Loader:
- Redirect to /dashboard on authenticated

Action:
- Returns correct error messages on validation failure
? - Should throw correct error on profile or user not found (TODO: not current behaviour)
--> Question: we dont want to show which emails are registered. How to solve this?
? - Should redirect to mint-id password reset on provider keycloak (TODO: not current behaviour)
--> Current behaviour: log statement on the server with no info on the client
--> Question: we dont want to show which emails are registered. How to solve this?
- Does not return "User not found" error
- Returns actionData.success === true on reset success or on "User not found" error
? --> Trims the form input values and normalizes the email to lower case (TODO: Not current behaviour)
? --> Only login_redirect param to own domain should work (TODO: Not current behaviour)


Functional tests:

- Render test
- Reset form works (success, failure, login_redirect searchParam)
--> submit with enter works
--> validation errors are rendered on the input fields (or on the form if global)
? --> After first validation the form is revalidated onChange and hides the errors on successful revalidation
? --> Only redirect param to own domain should work (TODO: Not current behaviour)
? --> E-Mail is sent (can we check this?)
? --> E-Mail is not send on "User not found" (can we check this?)
? --> E-Mail verification link contains the correct login_redirect param if present
- All links work
--> Link to login ships along the login_redirect searchParam
? - No browser console warnings/errors

*/
