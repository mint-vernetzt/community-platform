import { locale as deMeta } from "./de/meta";
import { locale as enMeta } from "./en/meta";
import { locale as frMeta } from "./fr/meta";
import { locale as deOffers } from "./de/datasets/offers";
import { locale as enOffers } from "./en/datasets/offers";
import { locale as frOffers } from "./fr/datasets/offers";
import { locale as deFooter } from "./de/organisms/footer";
import { locale as enFooter } from "./en/organisms/footer";
import { locale as frFooter } from "./fr/organisms/footer";
import { locale as deProfileCard } from "./de/organisms/cards/profile-card";
import { locale as enProfileCard } from "./en/organisms/cards/profile-card";
import { locale as frProfileCard } from "./fr/organisms/cards/profile-card";
import { locale as deAddAdmin } from "./de/routes/event/$slug/settings/admins/add-admin";
import { locale as enAddAdmin } from "./en/routes/event/$slug/settings/admins/add-admin";
import { locale as deRemoveAdmin } from "./de/routes/event/$slug/settings/admins/remove-admin";
import { locale as enRemoveAdmin } from "./en/routes/event/$slug/settings/admins/remove-admin";
import { locale as deExploreFundings } from "./de/routes/explore/fundings";
import { locale as enExploreFundings } from "./en/routes/explore/fundings";
import { locale as frExploreFundings } from "./fr/routes/explore/fundings";
import { locale as deExploreProfiles } from "./de/routes/explore/profiles";
import { locale as enExploreProfiles } from "./en/routes/explore/profiles";
import { locale as frExploreProfiles } from "./fr/routes/explore/profiles";

/**
 * This is the map of all language modules.
 *
 * The key is the language code in combination with the route pathname.
 * The values are fully typed locales from those routes.
 *
 * To add a new language following steps are required:
 *
 * 1. Copy an existing language folder and rename it to the new language code.
 * 2. Translate all files in the new language folder.
 * 3. Add the new language to the `supportedCookieLanguages` array in `i18n.ts`.
 * - Dont panic if all modules have type errors, the next steps fix these.
 * 4. Add the new language to the `supportedHeaderLanguages` array and transform them into a single value inside the schema in `i18n.server.ts`.
 * - Full list: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
 * - Comprehensive list (more grouped): https://www.niefuend.org/blog/internet/2017/10/alle-accept-language-codes-mit-laendernamen/
 * 4. Add the new language to the `languageModuleMap` object below.
 *
 */

const de = {
  root: { ...deMeta, ...deFooter },
  "event/$slug/settings/admins/add-admin": deAddAdmin,
  "event/$slug/settings/admins/remove-admin": deRemoveAdmin,
  "explore/fundings": deExploreFundings,
  "explore/profiles": {
    ...deExploreProfiles,
    offers: { ...deOffers },
    ...deProfileCard,
  },
} as const;

const en = {
  root: { ...enMeta, ...enFooter },
  "event/$slug/settings/admins/add-admin": enAddAdmin,
  "event/$slug/settings/admins/remove-admin": enRemoveAdmin,
  "explore/fundings": enExploreFundings,
  "explore/profiles": {
    ...enExploreProfiles,
    offers: { ...enOffers },
    ...enProfileCard,
  },
} as const;

// poc
const fr = {
  ...en,
  root: { ...frMeta, ...frFooter },
  "explore/fundings": frExploreFundings,
  "explore/profiles": {
    ...frExploreProfiles,
    offers: { ...frOffers },
    ...frProfileCard,
  },
} as const;

export const languageModuleMap = {
  de,
  en,
  // poc
  fr,
} as const;
