import { ProfileFormType } from "../../routes/profile/$username/edit/yupSchema";
import { capitalizeFirstLetter } from "../string/transform";

/*
areas: array(
    object({
      areaId: number().required(),
      area: object({ name: string().required() }),
    })
  ),
*/

export function createProfileFromFormData(formData: FormData): ProfileFormType {
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
    offerings: (formData.getAll("offerings") ?? []) as string[],
    seekings: (formData.getAll("seekings") ?? []) as string[],
    publicFields: (formData.getAll("publicFields") ?? []) as string[],
    areas: (formData.getAll("areas") ?? []) as string[],
    website: formData.get("website") as string,
    facebook: formData.get("facebook") as string,
    linkedin: formData.get("linkedin") as string,
    twitter: formData.get("twitter") as string,
    xing: formData.get("xing") as string,
  };
}

export function getListOperationName(operation: string, name: string) {
  const ucSingularName = capitalizeFirstLetter(name.slice(0, -1));
  return `${operation}${ucSingularName}`;
}

export function addListEntry(
  name: keyof ProfileFormType,
  value: string,
  profile: ProfileFormType
) {
  return {
    ...profile,
    [name]: [...(profile[name] as string[]), value],
  };
}

export function removeListEntry(
  name: keyof ProfileFormType,
  value: string,
  profile: ProfileFormType
) {
  return {
    ...profile,
    [name]: (profile[name] as string[]).filter((v) => v !== value) as string[],
  };
}

export function profileListOperationResolver(
  profile: ProfileFormType,
  name: keyof ProfileFormType,
  formData: FormData
) {
  const submit = formData.get("submit");
  const addOperation = getListOperationName("add", name);

  if (submit === addOperation && formData.get(addOperation) !== "") {
    return addListEntry(
      name,
      (formData.get(addOperation) as string) ?? "",
      profile
    );
  }

  const removeOperation = getListOperationName("remove", name);
  if (formData.get(removeOperation) !== "") {
    return removeListEntry(
      name,
      (formData.get(removeOperation) as string) ?? "",
      profile
    );
  }

  return profile;
}
