/* 

Unit tests:

Loader:
- Redirect to /dashboard on authenticated

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
--> Link to register and reset password ship along the login_redirect searchParam
? - No browser console warnings/errors

*/
