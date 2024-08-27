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
