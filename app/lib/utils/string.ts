export function transformAbsoluteURL(
  url: string,
  urlEndingToRemove: string,
  urlEndingToAppend: string
) {
  return (
    url.substring(0, url.length - urlEndingToRemove.length) + urlEndingToAppend
  );
}
