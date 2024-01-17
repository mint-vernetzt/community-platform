/*

Functional tests:

? - Render test
- All hash parameters are forwarded correctly for each verification type (with and without login_redirect search param)
--> type signup should lead to /register/verify
--> type recovery should lead to /reset/set-password
--> type email_change should lead to /reset/set-email
- Error alert is shown when error, errorCode or errorDescription !== null
? --> User is redirected to login after closing the error alert (TODO: not current behaviour)
- When tokens or the valid type parameters are not provided and there is no error param the user should be redirected to /login
? - No browser console warnings/errors

*/
