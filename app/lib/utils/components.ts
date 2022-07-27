import { InferType } from "yup";
import { AnyObject, OptionalObjectSchema } from "yup/lib/object";
import { capitalizeFirstLetter } from "../string/transform";

function getListOperationName(operation: string, key: string) {
  const ucSingularKey = capitalizeFirstLetter(key.slice(0, -1));
  return `${operation}${ucSingularKey}`;
}

// TODO: Find better name
function addListEntry<T extends InferType<OptionalObjectSchema<AnyObject>>>(
  key: keyof T,
  value: string,
  object: T
) {
  return {
    ...object,
    [key]: [...(object[key] as string[]), value],
  };
}

// TODO: Find better name
function removeListEntry<T extends InferType<OptionalObjectSchema<AnyObject>>>(
  key: keyof T,
  value: string,
  object: T
) {
  return {
    ...object,
    [key]: (object[key] as string[]).filter((v) => v !== value) as string[],
  };
}

// TODO: Find better name
export function objectListOperationResolver<
  T extends InferType<OptionalObjectSchema<AnyObject>>
>(object: T, key: keyof T, formData: FormData) {
  key = key as string;

  const submit = formData.get("submit");
  const addOperation = getListOperationName("add", key);

  if (submit === addOperation && formData.get(addOperation) !== "") {
    return addListEntry<T>(
      key,
      (formData.get(addOperation) as string) ?? "",
      object
    );
  }

  const removeOperation = getListOperationName("remove", key);
  if (formData.get(removeOperation) !== "") {
    return removeListEntry<T>(
      key,
      (formData.get(removeOperation) as string) ?? "",
      object
    );
  }

  return object;
}
