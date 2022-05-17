import { Area } from "@prisma/client";
import {
  OptGroupProps,
  OptionsProps,
} from "./../../components/FormElements/SelectField/SelectField";

import { OptionOrGroup } from "~/components/FormElements/SelectField/SelectField";
import { AreasWithState } from "~/profile.server";

export function createAreaOptionFromData(
  areas: AreasWithState
): OptionOrGroup[] {
  const divider: OptGroupProps = { label: "----------", options: [] };

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
