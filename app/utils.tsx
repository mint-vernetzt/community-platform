import { json } from "remix";

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
