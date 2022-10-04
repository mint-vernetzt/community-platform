export function getWindow() {
  return typeof window !== "undefined" ? window : null;
}

export function getURLSearchParameterFromURLHash() {
  const clientWindow = getWindow();
  if (clientWindow === null) {
    return null;
  }
  return new URLSearchParams(window.location.hash.slice(1));
}
