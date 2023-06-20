export function formMapper(formData: FormData) {
  return {
    institution: (formData.get("institution") as string) ?? "",
    firstName: (formData.get("firstName") as string) ?? "",
    lastName: (formData.get("lastName") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    phone: (formData.get("phone") as string) ?? "",
    message: (formData.get("message") as string) ?? "",
    reachableBy: (formData.get("message") as string) ?? "",
    terms_accepted: (formData.get("terms_accepted") as string) ?? "",
  };
}
