export function addUrlPrefix(url: string) {
  let validUrl = url;
  if (url !== "" && url.search(/^https?:\/\//) === -1) {
    validUrl = "https://" + url;
  }
  return validUrl;
}
