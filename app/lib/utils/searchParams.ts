// List to better keep track of used search params
export const SearchProfiles = "search-profiles";
export const SearchOrganizations = "search-organizations";
export const Deep = "deep";
export const UnsavedChangesModal = "modal-unsaved-changes";

export function extendSearchParams(
  params: URLSearchParams,
  options: {
    addOrReplace?: Record<string, string>;
    remove?: string[];
  }
) {
  const { addOrReplace, remove } = options;
  const extendSearchParams = new URLSearchParams(params);
  if (addOrReplace) {
    for (const key in addOrReplace) {
      extendSearchParams.set(key, addOrReplace[key]);
    }
  }
  if (remove) {
    for (const key of remove) {
      extendSearchParams.delete(key);
    }
  }
  return extendSearchParams;
}
