import { type FormMetadata, type SubmissionResult } from "@conform-to/react";
import { useEffect } from "react";
import { type Navigation } from "react-router";

export function useFormRevalidationAfterSuccess<
  T extends SubmissionResult<string[]> | undefined,
>(options: {
  deps: {
    navigation: Navigation;
    submissionResult: T;
    form: FormMetadata<any, string[]>;
  };
  skipRevalidation?: boolean;
  redirectToSameRouteOnDifferentURL?: boolean;
  extendedFunctionality?: Function;
}) {
  const {
    skipRevalidation = false,
    redirectToSameRouteOnDifferentURL = false,
    deps,
    extendedFunctionality,
  } = options;
  const { navigation, submissionResult, form } = deps;

  useEffect(() => {
    if (
      navigation.state === "idle" &&
      (redirectToSameRouteOnDifferentURL ||
        (typeof submissionResult !== "undefined" &&
          submissionResult.status === "success")) &&
      skipRevalidation === false
    ) {
      form.reset();
      if (typeof extendedFunctionality !== "undefined") {
        extendedFunctionality();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.state, submissionResult, skipRevalidation]);
}
