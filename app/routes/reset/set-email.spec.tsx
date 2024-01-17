/* 

Unit tests:

Loader:
- Does not redirect on authenticated (user can be still logged in on email change)
- Throws correct error message when tokens aren't provided or type is not "email_change"
- Throws correct error on setSession failure
- Throws correct error on profile not found (TODO: not current behaviour)
- Updates the profile email on success and redirects to /profile/$username
--> The user should be logged in
? --> Optional behaviour: redirect to dashboard with alert "email change successful" (TODO: not current behaviour)

Functional tests:

- user can not login with the old email
- user can login with the new email

*/
