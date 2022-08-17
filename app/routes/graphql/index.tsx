import {
  DeriveStatusCodeFunction,
  getActionFunction,
  getLoaderFunction,
} from "remix-graphql/index.server";
import { schema } from "~/api/schema";
import { context } from "~/api/context.server";

function hasStatus(error: any): error is { status: number } {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    typeof error.status === "number"
  );
}

const deriveStatusCode: DeriveStatusCodeFunction = (result, defaultStatus) =>
  result.errors
    ? result.errors.reduce(
        (maxStatus, error) =>
          hasStatus(error.extensions)
            ? Math.max(maxStatus, error.extensions.status)
            : maxStatus,
        defaultStatus
      )
    : defaultStatus;

export const loader = getLoaderFunction({ schema, context, deriveStatusCode });

export const action = getActionFunction({ schema, context, deriveStatusCode });
