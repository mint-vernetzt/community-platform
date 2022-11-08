import { serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";

export async function getFeatureAbilities(
  request: Request,
  featureNameOrNames: string | string[]
) {
  const result = await validateFeatureAccess(request, featureNameOrNames, {
    throw: false,
  });
  return result.abilities;
}

export async function checkFeatureAbilitiesOrThrow(
  request: Request,
  featureName: string
) {
  const result = await validateFeatureAccess(request, featureName);
  return result.abilities;
}

export async function validateFeatureAccess(
  request: Request,
  featureNameOrNames: string | string[],
  options: {
    throw: boolean;
  } = { throw: true }
) {
  const features = process.env.FEATURES;

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

  if (features === undefined) {
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

  let featureList = [];

  if (features !== undefined) {
    featureList = features
      .split(",")
      .map((value) => value.trimStart().trimEnd()); // remove whitespace

    for (const featureName of featureNames) {
      if (featureList.indexOf(featureName) === -1) {
        const message = `Feature flag for "${featureName}" not found`;
        if (options.throw) {
          throw serverError({ message });
        }
        error = new Error(message);
        abilities[featureName] = {
          error,
          hasAccess: false,
        };
      } else {
        abilities[featureName] = { hasAccess: true };
      }
    }
  }

  const userIds = process.env.FEATURE_USER_IDS;

  if (userIds !== undefined) {
    const userIdList = userIds
      .split(",")
      .map((value) => value.trimStart().trimEnd()); // remove whitespace
    const user = await getUserByRequest(request);

    if (user === null || userIdList.indexOf(user.id) === -1) {
      for (const featureName of featureNames) {
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
