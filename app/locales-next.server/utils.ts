import { meta as deMeta } from "./de/meta";
import { meta as enMeta } from "./en/meta";
import { meta as frMeta } from "./fr/meta";
import { offers as deOffers } from "./de/datasets/offers";
import { offers as enOffers } from "./en/datasets/offers";
import { offers as frOffers } from "./fr/datasets/offers";
import { footer as deFooter } from "./de/organisms/footer";
import { footer as enFooter } from "./en/organisms/footer";
import { footer as frFooter } from "./fr/organisms/footer";
import { profileCard as deProfileCard } from "./de/organisms/cards/profile-card";
import { profileCard as enProfileCard } from "./en/organisms/cards/profile-card";
import { profileCard as frProfileCard } from "./fr/organisms/cards/profile-card";
import { fundings as deExploreFundings } from "./de/routes/explore/fundings";
import { fundings as enExploreFundings } from "./en/routes/explore/fundings";
import { fundings as frExploreFundings } from "./fr/routes/explore/fundings";
import { profiles as deExploreProfiles } from "./de/routes/explore/profiles";
import { profiles as enExploreProfiles } from "./en/routes/explore/profiles";
import { profiles as frExploreProfiles } from "./fr/routes/explore/profiles";

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

export const languageModuleMap = {
  de: {
    root: { ...deMeta, ...deFooter },
    "explore/fundings": deExploreFundings,
    "explore/profiles": {
      ...deExploreProfiles,
      offers: { ...deOffers },
      ...deProfileCard,
    },
  },
  en: {
    root: { ...enMeta, ...enFooter },
    "explore/fundings": enExploreFundings,
    "explore/profiles": {
      ...enExploreProfiles,
      offers: { ...enOffers },
      ...enProfileCard,
    },
  },
  fr: {
    root: { ...frMeta, ...frFooter },
    "explore/fundings": frExploreFundings,
    "explore/profiles": {
      ...frExploreProfiles,
      offers: { ...frOffers },
      ...frProfileCard,
    },
  },
} as const;
