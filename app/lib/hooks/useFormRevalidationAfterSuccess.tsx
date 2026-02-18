import { type FormMetadata, type SubmissionResult } from "@conform-to/react";
import { useEffect } from "react";
import { type Navigation } from "react-router";

export function useFormRevalidationAfterSuccess<
  T extends SubmissionResult<string[]> | undefined,
>(options: {
  deps: {
    navigation: Navigation;
    actionData: T;
    form: FormMetadata<any, string[]>;
  };
  skipRevalidation?: boolean;
}) {
  const { skipRevalidation = false, deps } = options;
  const { navigation, actionData, form } = deps;

  useEffect(() => {
    if (
      navigation.state === "idle" &&
      typeof actionData !== "undefined" &&
      actionData.status === "success" &&
      skipRevalidation === false
    ) {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.state, actionData, skipRevalidation]);
}
