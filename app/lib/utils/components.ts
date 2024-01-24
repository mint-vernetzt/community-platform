import type { InferType } from "yup";
import type { AnyObject, OptionalObjectSchema } from "yup/lib/object";
import type {
  OptGroupProps,
  OptionOrGroup,
  OptionsProps,
} from "~/components/FormElements/SelectField/SelectField";
import { capitalizeFirstLetter } from "../string/transform";
import { type Area, type State } from "@prisma/client";

type AreasWithState = (Area & {
  state: State | null;
})[];

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
    // TODO: can this type assertion be removed and proofen by code?
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
    // TODO: can this type assertion be removed and proofen by code?
    [key]: (object[key] as string[]).filter((v) => v !== value) as string[],
  };
}

// TODO: Find better name
export function objectListOperationResolver<
  T extends InferType<OptionalObjectSchema<AnyObject>>
>(object: T, key: keyof T, formData: FormData) {
  // TODO: can this type assertion be removed and proofen by code?
  key = key as string;

  const submit = formData.get("submit");
  const addOperation = getListOperationName("add", key);

  if (submit === addOperation && formData.get(addOperation) !== "") {
    return addListEntry<T>(
      key,
      // TODO: can this type assertion be removed and proofen by code?
      (formData.get(addOperation) as string) ?? "",
      object
    );
  }

  const removeOperation = getListOperationName("remove", key);
  if (formData.get(removeOperation) !== "") {
    return removeListEntry<T>(
      key,
      // TODO: can this type assertion be removed and proofen by code?
      (formData.get(removeOperation) as string) ?? "",
      object
    );
  }

  return object;
}

export function createAreaOptionFromData(
  areas: AreasWithState
): OptionOrGroup[] {
  const divider: OptGroupProps = { label: "----------", options: [] };

  const globalEntry = areas.filter((area) => area.type === "global")[0];
  const globalOption: OptionsProps = {
    label: globalEntry.name,
    value: `${globalEntry.id}`,
  };

  const nationalEntry = areas.filter((area) => area.type === "country")[0];
  const nationalOption: OptionsProps = {
    label: nationalEntry.name,
    value: `${nationalEntry.id}`,
  };

  const states = areas
    .filter((area) => area.type === "state")
    .sort((a, b) => a.name.localeCompare(b.name));
  const stateOptions = states.map((state) => ({
    label: state.name,
    value: state.id,
  }));

  const districtOptions = states.map((state) => ({
    label: state.name,
    options: areas
      .filter(
        (area) => area.type === "district" && area.stateId === state.stateId
      )
      .map((district) => ({
        label: district.name,
        value: district.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }));

  return [
    globalOption,
    divider,
    nationalOption,
    divider,
    {
      label: "Bundesland",
      options: stateOptions,
    },
    divider,
    ...districtOptions,
  ];
}
