export function requireHeader(headers: Headers, header: string) {
  if (!headers.has(header)) {
    const headersString = JSON.stringify(
      Object.fromEntries(headers.entries()),
      null,
      2
    );
    throw new Error(
      `Header "${header}" required, but not found in ${headersString}`
    );
  }
  return headers.get(header);
}
