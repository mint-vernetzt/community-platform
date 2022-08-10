import { serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";

export async function validateFeatureAccess(
  request: Request,
  featureName: string
) {
  const features = process.env.FEATURES;

  if (features === undefined) {
    const message = "No feature flags found";
    console.error(message);
    throw serverError({ message });
  }

  const featureList = features
    .split(",")
    .map((value) => value.trimStart().trimEnd()); // remove whitespace

  if (featureList.indexOf(featureName) === -1) {
    const message = `Feature flag for "${featureName}" not found`;
    console.error(message);
    throw serverError({ message });
  }

  const userIds = process.env.FEATURE_USER_IDS;

  if (userIds !== undefined) {
    const userIdList = userIds
      .split(",")
      .map((value) => value.trimStart().trimEnd()); // remove whitespace
    const user = await getUserByRequest(request);

    if (user === null || userIdList.indexOf(user.id) === -1) {
      const message = `User hasn't access to feature "${featureName}"`;
      console.error(message);
      throw serverError({ message });
    }
  }
}
