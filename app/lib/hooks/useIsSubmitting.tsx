import { useLocation, useNavigation } from "react-router";

export function useIsSubmitting(action?: string) {
  const location = useLocation();
  const formAction =
    typeof action !== "undefined"
      ? action
      : `${location.pathname}${location.search}`;
  const navigation = useNavigation();
  const isSubmitting = navigation.formAction === formAction;

  return isSubmitting;
}
