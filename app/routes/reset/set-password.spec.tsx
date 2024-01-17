/* 

Unit tests:

Loader:
- Redirect to dashboard on authenticated
- Throws correct error message when tokens aren't provided
--> Should throw an error if type !== "recovery" (TODO: not current behaviour)
- Throws correct error on setSession failure


Action:
- Returns correct error messages on validation failure
- Throws correct error on updatePassword failure
- Updates the password on success
--> Default redirect to dashboard
--> Redirects to login redirect when login_redirect searchParam is present
--> The user should be logged in

Functional tests:

- Render test
- set-password form works (success, failure, login_redirect searchParam)
--> submit with enter works (TODO: not current behaviour)
--> validation errors are rendered on the input fields (or on the form if global)
? --> After first validation the form is revalidated onChange and hides the errors on successful revalidation
? --> Only redirect param to own domain should work (TODO: Not current behaviour)
- User is redirected and logged in after successful set-password submission
--> Default redirect to dashboard
--> Redirects to login redirect when login_redirect searchParam is present
- User can not login with the old password
- User can login with the new password
? - No browser console warnings/errors

*/
