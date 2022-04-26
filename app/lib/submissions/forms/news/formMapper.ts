export function formMapper(formData: FormData) {
  return {
    title: (formData.get("title") as string) ?? "",
    text: (formData.get("text") as string) ?? "",
    source: (formData.get("source") as string) ?? "",
    contact_name: (formData.get("contact_name") as string) ?? "",
    contact_email: (formData.get("contact_email") as string) ?? "",
    terms_accepted: (formData.get("terms_accepted") as string) ?? "",
  };
}
