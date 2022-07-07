import { json, Session } from "remix";

export function badRequest(): Response {
  return json("Bad Request", { status: 400 });
}

export function validateFormData(
  requiredKeys: string[],
  formData: FormData
): boolean {
  const isValid = requiredKeys.every((key) => {
    const value = formData.get(key);
    return value !== null && value !== "";
  });
  return isValid;
}

export function generateUsername(firstName: string, lastName: string) {
  return generateValidSlug(`${firstName}${lastName}`);
}

export function generateOrganizationSlug(name: string) {
  return generateValidSlug(name);
}

function generateValidSlug(string: string) {
  return string
    .toLowerCase()
    .replace(/[áàâãå]/, "a")
    .replace(/[äæ]/, "ae")
    .replace(/[ç]/, "c")
    .replace(/[éèêë]/, "e")
    .replace(/[íìîï]/, "i")
    .replace(/[ñ]/, "n")
    .replace(/[ß]/, "ss")
    .replace(/[óòôõ]/, "o")
    .replace(/[öœø]/, "oe")
    .replace(/[úùû]/, "u")
    .replace(/[ü]/, "ue")
    .replace(/[^\w ]/g, "")
    .replace(/[\s]/g, "");
}

export async function validateCSRFToken(request: Request, session: Session) {
  let body = Object.fromEntries(
    new URLSearchParams(await request.clone().text()).entries()
  ) as { csrf?: string };

  if (!session.has("csrf")) {
    throw new Error("CSRF Token not included");
  }
  if (!body.csrf) {
    throw new Error("CSRF Token not included");
  }
  if (body.csrf !== session.get("csrf")) {
    throw new Error("CSRF tokens do not match");
  }
}
