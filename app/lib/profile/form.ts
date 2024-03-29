import { addUrlPrefix } from "../string/addUrlPrefix";
import { capitalizeFirstLetter } from "../string/transform";

/*
areas: array(
    object({
      areaId: number().required(),
      area: object({ name: string().required() }),
    })
  ),
*/

// TODO: can this type assertions be removed and proofen by code?
export function createProfileFromFormData(formData: FormData) {
  return {
    academicTitle: formData.get("academicTitle") as string,
    position: formData.get("position") as string,
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    bio: formData.get("bio") as string,
    interests: (formData.getAll("interests") ?? []) as string[],
    skills: (formData.getAll("skills") ?? []) as string[],
    offers: (formData.getAll("offers") ?? []) as string[],
    seekings: (formData.getAll("seekings") ?? []) as string[],
    areas: (formData.getAll("areas") ?? []) as string[],
    website: addUrlPrefix(formData.get("website") as string),
    facebook: addUrlPrefix(formData.get("facebook") as string),
    linkedin: addUrlPrefix(formData.get("linkedin") as string),
    twitter: addUrlPrefix(formData.get("twitter") as string),
    xing: addUrlPrefix(formData.get("xing") as string),
  };
}

export function getListOperationName(operation: string, name: string) {
  const ucSingularName = capitalizeFirstLetter(name.slice(0, -1));
  return `${operation}${ucSingularName}`;
}

export function addListEntry(
  name: keyof typeof createProfileFromFormData,
  value: string,
  profile: typeof createProfileFromFormData
) {
  return {
    ...profile,
    // TODO: can this type assertion be removed and proofen by code?
    [name]: [...(profile[name] as string[]), value],
  };
}

export function removeListEntry(
  name: keyof typeof createProfileFromFormData,
  value: string,
  profile: typeof createProfileFromFormData
) {
  return {
    ...profile,
    // TODO: can this type assertion be removed and proofen by code?
    [name]: (profile[name] as string[]).filter((v) => v !== value) as string[],
  };
}

export function profileListOperationResolver(
  profile: typeof createProfileFromFormData,
  name: keyof typeof createProfileFromFormData,
  formData: FormData
) {
  const submit = formData.get("submit");
  const addOperation = getListOperationName("add", name);

  if (submit === addOperation && formData.get(addOperation) !== "") {
    return addListEntry(
      name,
      // TODO: can this type assertion be removed and proofen by code?
      (formData.get(addOperation) as string) ?? "",
      profile
    );
  }

  const removeOperation = getListOperationName("remove", name);
  if (formData.get(removeOperation) !== "") {
    return removeListEntry(
      name,
      // TODO: can this type assertion be removed and proofen by code?
      (formData.get(removeOperation) as string) ?? "",
      profile
    );
  }

  return profile;
}
