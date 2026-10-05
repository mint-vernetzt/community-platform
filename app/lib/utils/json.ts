type Args = Parameters<typeof JSON.stringify>;

export function safeStringify(...args: Args): string {
  if (typeof args[0] === "string") {
    return args[0];
  }
  try {
    return JSON.stringify(...args) ?? String(args[0]);
  } catch {
    return "[unserializable]";
  }
}
