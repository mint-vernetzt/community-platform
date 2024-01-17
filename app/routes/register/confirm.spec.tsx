/* 

Unit tests:

Loader:
- Redirect to /dashboard on authenticated
- All possible errors are thrown when the confirmation link doesn't have the right structure
? --> Only login_redirect param to own domain should work (TODO: Not current behaviour)
- Returns correct data structure


Functional tests:

- Render test
- Confirmation link leads to supabase auth service and then to /verification
--> It ships all parameters while doing that (login_redirect and type)
? - No browser console warnings/errors

*/
