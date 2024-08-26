export function extendSearchParams(
  params: URLSearchParams,
  options: {
    set?: Record<string, string>;
    remove?: string[];
  }
) {
  const { set, remove } = options;
  const extendSearchParams = new URLSearchParams(params);
  if (set) {
    for (const key in set) {
      extendSearchParams.set(key, set[key]);
    }
  }
  if (remove) {
    for (const key of remove) {
      extendSearchParams.delete(key);
    }
  }
  return extendSearchParams;
}
