export function getBaseURL(baseURL?: string) {
  if (baseURL !== undefined) {
    const url = new URL(baseURL);
    baseURL = url.origin;
  }
  return baseURL;
}
