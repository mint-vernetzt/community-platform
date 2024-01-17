/* 

Unit tests:

Loader:
- Redirect to /dashboard on authenticated
? - Redirects to /register if accessToken and/or refreshToken is not provided (TODO: Not current behaviour)
? --> Current behaviour is returning an empty body and staying on the page
? --> Same behaviour if type param is not "signup"
- Throws correct error if user meta data is not complete
- Throws correct error and does not create a profile if session could not be set
? --> Is the server side alert even rendered without a default component?
- Creates profile on correct token and type combination, when session is set and user meta data is complete
--> The prisma call also creates the two relations ProfileVisibility and notificationSettings
- The user is logged in after successful verification
--> set-cookie header is present and valid
--> Redirect to /profile/$username on success
--> Redirect to loginRedirect if login_redirect param is specified
? --> Only login_redirect param to own domain should work (TODO: Not current behaviour)

*/
