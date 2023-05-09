import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { serverError } from "remix-utils";
import { getSessionUser } from "~/auth.server";

export async function getFeatureAbilities(
  authClient: SupabaseClient,
  featureNameOrNames: string | string[]
) {
  const result = await validateFeatureAccess(authClient, featureNameOrNames, {
    throw: false,
  });
  return result.abilities;
}

export async function checkFeatureAbilitiesOrThrow(
  authClient: SupabaseClient,
  featureName: string
) {
  const result = await validateFeatureAccess(authClient, featureName);
  return result.abilities;
}

/**
 * @description
 * Please use getFeatureAbilities() or checkFeatureAbilitiesOrThrow()
 */
export async function validateFeatureAccess(
  authClient: SupabaseClient,
  featureNameOrNames: string | string[],
  options: {
    throw: boolean;
  } = { throw: true }
) {
  const featureFlags = process.env.FEATURE_FLAGS;

  let error: Error | undefined;

  let featureNames: string[] = [];
  if (typeof featureNameOrNames === "string") {
    featureNames.push(featureNameOrNames);
  } else {
    featureNames = featureNameOrNames;
  }

  let abilities: {
    [key: string]: {
      error?: Error;
      hasAccess: boolean;
    };
  } = {};

  let featureList: Array<{
    name: string;
    idsWithAccess: string[];
  }> = [];

  if (featureFlags !== undefined) {
    // Example format at this point: "events:1798752d-3901-4247-b375-51285141d158,5a39958c-a1de-4716-8081-ddcdefb6a760;projects:fb30b5e4-9daa-40e2-bd8f-71c6ce827c7a;"
    featureList = featureFlags.split(";").map((featureFlag) => {
      // Example format at this point: ["events:1798752d-3901-4247-b375-51285141d158,5a39958c-a1de-4716-8081-ddcdefb6a760", "projects:fb30b5e4-9daa-40e2-bd8f-71c6ce827c7a"]
      let splittedFeatureFlag = featureFlag.trim().split(":");
      // Example format at this point: ["events", "1798752d-3901-4247-b375-51285141d158,5a39958c-a1de-4716-8081-ddcdefb6a760"]
      let featureListItem = {
        name: splittedFeatureFlag[0].trim(),
        idsWithAccess: splittedFeatureFlag[1]
          ? splittedFeatureFlag[1]
              .trim()
              .split(",")
              .map((id) => id.trim())
          : [],
        // Example format at this point: ["1798752d-3901-4247-b375-51285141d158", "5a39958c-a1de-4716-8081-ddcdefb6a760"]
      };
      return featureListItem;
    });

    for (const featureName of featureNames) {
      // Feature flag not present in .env
      if (!featureList.some((feature) => feature.name === featureName)) {
        const message = `Feature flag for "${featureName}" not found`;
        console.error(message);
        if (options.throw) {
          throw serverError({ message });
        }
        error = new Error(message);
        abilities[featureName] = {
          error,
          hasAccess: false,
        };
      }
      // Feature flag is present in .env
      else {
        const user = await getSessionUser(authClient);
        // User id is present in the current looped feature of the featureList
        if (
          user !== null &&
          featureList.some(
            (feature) =>
              feature.name === featureName &&
              (feature.idsWithAccess.includes(user.id) ||
                feature.idsWithAccess.length === 0)
          )
        ) {
          abilities[featureName] = { hasAccess: true };
        }
        // User is null or not present in the current looped feature of the featureList
        else {
          const message = `User hasn't access to feature "${featureName}"`;
          console.error(message);
          if (options.throw) {
            throw serverError({ message });
          }
          error = new Error(message);
          abilities[featureName] = {
            error,
            hasAccess: false,
          };
        }
      }
    }
  } else {
    const message = "No feature flags found";
    console.error(message);
    if (options.throw) {
      throw serverError({ message });
    }
    error = new Error(message);

    for (const featureName of featureNames) {
      abilities[featureName] = {
        error,
        hasAccess: false,
      };
    }
  }

  let result;
  if (typeof featureNameOrNames === "string") {
    result = {
      error,
      hasAccess: error === undefined,
      featureName: featureNameOrNames,
      abilities,
    };
  } else {
    result = { abilities };
  }

  return result;
}
