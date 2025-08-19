import { getInputProps, type useForm } from "@conform-to/react-v1";
import { type FilterSchemes } from "~/routes/explore/all.shared";
import { useConformForm } from "./ConformForm";

function HiddenFilterInputs(props: {
  defaultValue: FilterSchemes;
  fields: ReturnType<typeof useForm<FilterSchemes>>[1];
  entityLeftOut?: "profile" | "organization" | "event" | "project" | "funding";
}) {
  const { fields, defaultValue, entityLeftOut } = props;

  const prfFilterFieldset = fields.prfFilter.getFieldset();
  const prfFilterOfferFieldList = prfFilterFieldset.offer.getFieldList();
  const prfFilterAreaFieldList = prfFilterFieldset.area.getFieldList();
  const orgFilterFieldset = fields.orgFilter.getFieldset();
  const orgFilterAreaFieldList = orgFilterFieldset.area.getFieldList();
  const orgFilterFocusFieldList = orgFilterFieldset.focus.getFieldList();
  const orgFilterTypeFieldList = orgFilterFieldset.type.getFieldList();
  const orgFilterNetworkTypeFieldList =
    orgFilterFieldset.networkType.getFieldList();
  const orgFilterNetworkFieldList = orgFilterFieldset.network.getFieldList();
  const evtFilterFieldset = fields.evtFilter.getFieldset();
  const evtFilterAreaFieldList = evtFilterFieldset.area.getFieldList();
  const evtFilterTargetGroupFieldList =
    evtFilterFieldset.eventTargetGroup.getFieldList();
  const evtFilterFocusFieldList = evtFilterFieldset.focus.getFieldList();
  const prjFilterFieldset = fields.prjFilter.getFieldset();
  const prjFilterAdditionalDisciplineFieldList =
    prjFilterFieldset.additionalDiscipline.getFieldList();
  const prjFilterAreaFieldList = prjFilterFieldset.area.getFieldList();
  const prjFilterDisciplineFieldList =
    prjFilterFieldset.discipline.getFieldList();
  const prjFilterFinancingFieldList =
    prjFilterFieldset.financing.getFieldList();
  const prjFilterFormatFieldList = prjFilterFieldset.format.getFieldList();
  const prjFilterTargetGroupFieldList =
    prjFilterFieldset.projectTargetGroup.getFieldList();
  const prjFilterSpecialTargetGroupFieldList =
    prjFilterFieldset.specialTargetGroup.getFieldList();
  const fndFilterFieldset = fields.fndFilter.getFieldset();
  const fndFilterAreasFieldList = fndFilterFieldset.areas.getFieldList();
  const fndFilterEligibleEntitiesFieldList =
    fndFilterFieldset.eligibleEntities.getFieldList();
  const fndFilterRegionsFieldList = fndFilterFieldset.regions.getFieldList();
  const fndFilterTypesFieldList = fndFilterFieldset.types.getFieldList();

  return (
    <>
      {entityLeftOut !== "profile" ? (
        <>
          {/* Hidden profile filters */}
          <fieldset>
            <ul>
              {prfFilterOfferFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {prfFilterAreaFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <input {...getInputProps(fields.prfAreaSearch, { type: "hidden" })} />
          <input {...getInputProps(fields.prfPage, { type: "hidden" })} />
          <input {...getInputProps(fields.prfSortBy, { type: "hidden" })} />
        </>
      ) : null}

      {entityLeftOut !== "organization" ? (
        <>
          {/* Hidden organization filters */}
          <fieldset>
            <ul>
              {orgFilterAreaFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {orgFilterFocusFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {orgFilterTypeFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {orgFilterNetworkTypeFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {orgFilterNetworkFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <input {...getInputProps(fields.orgAreaSearch, { type: "hidden" })} />
          <input {...getInputProps(fields.orgPage, { type: "hidden" })} />
          <input {...getInputProps(fields.orgSortBy, { type: "hidden" })} />
        </>
      ) : null}

      {entityLeftOut !== "event" ? (
        <>
          {/* Hidden event filters */}
          <fieldset>
            <input
              {...getInputProps(evtFilterFieldset.periodOfTime, {
                type: "hidden",
              })}
            />
            <input
              {...getInputProps(evtFilterFieldset.stage, { type: "hidden" })}
            />
            <ul>
              {evtFilterAreaFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {evtFilterFocusFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {evtFilterTargetGroupFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <input {...getInputProps(fields.evtAreaSearch, { type: "hidden" })} />
          <input {...getInputProps(fields.evtPage, { type: "hidden" })} />
          <input {...getInputProps(fields.evtSortBy, { type: "hidden" })} />
        </>
      ) : null}

      {entityLeftOut !== "project" ? (
        <>
          {/* Hidden project filters */}
          <fieldset>
            <ul>
              {prjFilterDisciplineFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {prjFilterAdditionalDisciplineFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {prjFilterAreaFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {prjFilterFinancingFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {prjFilterFormatFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {prjFilterTargetGroupFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {prjFilterSpecialTargetGroupFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <input {...getInputProps(fields.prjAreaSearch, { type: "hidden" })} />
          <input {...getInputProps(fields.prjPage, { type: "hidden" })} />
          <input {...getInputProps(fields.prjSortBy, { type: "hidden" })} />
        </>
      ) : null}

      {entityLeftOut !== "funding" ? (
        <>
          {/* Hidden funding filters */}
          <fieldset>
            <ul>
              {fndFilterAreasFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {fndFilterEligibleEntitiesFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {fndFilterRegionsFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
            <ul>
              {fndFilterTypesFieldList.map((usedFields) => {
                return (
                  <li key={usedFields.key}>
                    <input {...getInputProps(usedFields, { type: "hidden" })} />
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <input {...getInputProps(fields.fndPage, { type: "hidden" })} />
          <input {...getInputProps(fields.fndSortBy, { type: "hidden" })} />
        </>
      ) : null}

      {/* Hidden search and show Filters */}
      <input
        {...getInputProps(fields.search, { type: "hidden" })}
        defaultValue={defaultValue.search.join(" ")}
      />
      <input {...getInputProps(fields.showFilters, { type: "hidden" })} />
    </>
  );
}

function HiddenFilterInputsInContext(props: {
  entityLeftOut?: "profile" | "organization" | "event" | "project" | "funding";
}) {
  const { entityLeftOut } = props;

  const { fields, useFormOptions } = useConformForm();

  return (
    <HiddenFilterInputs
      fields={fields as ReturnType<typeof useForm<FilterSchemes>>[1]}
      defaultValue={useFormOptions.defaultValue as NonNullable<FilterSchemes>}
      entityLeftOut={entityLeftOut}
    />
  );
}

export { HiddenFilterInputs, HiddenFilterInputsInContext };
