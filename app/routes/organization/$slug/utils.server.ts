export type Mode = "anon" | "authenticated" | "owner";

export function deriveMode(
  sessionUsername: string,
  isPrivileged: boolean
): Mode {
  if (sessionUsername === "" || sessionUsername === undefined) {
    return "anon";
  }

  return isPrivileged ? "owner" : "authenticated";
}
