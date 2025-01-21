import { type Area } from "@prisma/client";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type GeneralProjectSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["project/$slug/settings/general"];

type Option = {
  label: string;
  value?: string;
};

export function createAreaOptions(
  areas: Pick<Area, "id" | "name" | "stateId" | "type">[]
): Option[] {
  const divider = { label: "----------" };

  const globalEntry = areas.filter((area) => area.type === "global")[0];
  const globalOption = {
    label: globalEntry.name,
    value: globalEntry.id,
  };

  const nationalEntry = areas.filter((area) => area.type === "country")[0];
  const nationalOption = {
    label: nationalEntry.name,
    value: nationalEntry.id,
  };

  const stateHeader = { label: "Bundesland" };
  const states = areas
    .filter((area) => area.type === "state")
    .sort((a, b) => a.name.localeCompare(b.name));
  const stateOptions = states.map((state) => ({
    label: state.name,
    value: state.id,
  }));

  const districtOptions: Option[] = [];

  states.map((state) => {
    districtOptions.push(divider);
    const districtsOfStateHeader = {
      label: state.name,
    };
    districtOptions.push(districtsOfStateHeader);
    areas
      .filter(
        (area) => area.type === "district" && area.stateId === state.stateId
      )
      .map((district) => ({
        label: district.name,
        value: district.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((districtOfStateOption) => {
        districtOptions.push(districtOfStateOption);
        return null;
      });
    return null;
  });

  return [
    globalOption,
    divider,
    nationalOption,
    divider,
    stateHeader,
    ...stateOptions,
    ...districtOptions,
  ];
}
