/**
 * @vitest-environment jsdom
 */
import { test } from "vitest";

/* 

Unit tests:

Loader:
- Returns correct data structure on anon
- Returns correct data structure on authenticated
- Throws correct error on profile not found


Functional tests:

- Render test
--> html doc is rendered
--> On loader error html doc is rendered in the error boundary (TODO: This is not the current behaviour)
- All NavBar links work
--> HeaderLogo redirects to dashboard (/dashboard) on authenticated and to index (/) on anon
- Avatar and profile menu renders and works on authenticated
- Login/register links render and work on anon
- All Footer links work
- Search works
--> Correct redirect
--> Correct searchParam (query=...)
- Scroll-to-top Button works and includes searchParams
- NavNar should not render on non app base route (/login, /register, /reset)
- NavBar should render with z-index 10 (z-10) on index route (/)
- Alert should not render on non app base route (/login, /register, /reset) and index route (/)
- Scroll-to-top button should not render on non app base route (/login, /register, /reset)
- Footer and NavBar should be hidden on mobile project settings pages (md breakpoint)
- <body> has overflow-hidden on searchParam "modal"
- Styles are applied correctly
? - No browser console warnings/errors
? - Scroll Restoration works on all pages
? - Matomo script is correctly added and working

*/

test.skip("TODO", async () => {});
