//

// TODO: This hook needs remix v2

/**
 * Returns true if the current navigation is submitting the current route's
 * form. Defaults to the current route's form action and method POST.
 *
 * Defaults state to 'non-idle'
 *
 * NOTE: the default formAction will include query params, but the
 * navigation.formAction will not, so don't use the default formAction if you
 * want to know if a form is submitting without specific query params.
 */
export function useIsPending_notImplemented() {
  // 	formAction,
  // 	formMethod = 'POST',
  // 	state = 'non-idle',
  // }: {
  // 	formAction?: string
  // 	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
  // 	state?: 'submitting' | 'loading' | 'non-idle'
  // } = {}) {
  // 	const contextualFormAction = useFormAction()
  // 	const navigation = useNavigation()
  // 	const isPendingState =
  // 		state === 'non-idle'
  // 			? navigation.state !== 'idle'
  // 			: navigation.state === state
  // 	return (
  // 		isPendingState &&
  // 		navigation.formAction === (formAction ?? contextualFormAction) &&
  // 		navigation.formMethod === formMethod
  // 	)
  return null;
}
