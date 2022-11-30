import { User } from "@supabase/supabase-js";
import { badRequest, unauthorized } from "remix-utils";

export type Mode = "anon" | "authenticated" | "owner";

export function deriveMode(
  sessionUser: User | null,
  isPrivileged: boolean
): Mode {
  if (sessionUser === null) {
    return "anon";
  }

  return isPrivileged ? "owner" : "authenticated";
}

export async function checkIdentityOrThrow(
  request: Request,
  currentUser: User
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const userId = formData.get("userId");

  if (userId === null || userId !== currentUser.id) {
    throw unauthorized({ message: "Identity check failed" });
  }
}

export async function checkSameOrganizationOrThrow(
  request: Request,
  organizationId: string
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  console.log(formData);
  const value = formData.get("organizationId") as string | null;

  console.log(value, organizationId);

  if (value === null || value !== organizationId) {
    throw badRequest({ message: "Organization IDs differ" });
  }
}
