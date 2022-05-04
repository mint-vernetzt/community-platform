import { Area } from "@prisma/client";
import {
  OptGroupProps,
  OptionsProps,
} from "./../../components/FormElements/SelectField/SelectField";
import { AreasWithState } from "../../routes/profile/$username/edit/index";
import { OptionOrGroup } from "~/components/FormElements/SelectField/SelectField";

export function createAreaOptionFromData(
  areas: AreasWithState
): OptionOrGroup[] {
  const divider: OptionsProps = { label: "----------", value: "" };

  const nationalEntry = areas.filter((area) => area.type === "country")[0];
  const nationalOption: OptionsProps = {
    label: nationalEntry.name,
    value: `${nationalEntry.id}`,
  };

  const states = areas.filter((area) => area.type === "state");
  const stateOptions = states.map((state) => ({
    label: state.name,
    value: `${state.id}`,
  }));

  const districtOptions = states.map((state) => ({
    label: state.name,
    options: areas
      .filter(
        (area) => area.type === "district" && area.stateId === state.stateId
      )
      .map((district) => ({
        label: district.name,
        value: district.id.toString(),
      })),
  }));

  return [
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
