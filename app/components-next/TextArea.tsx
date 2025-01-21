import classNames from "classnames";
import React, { type FormEventHandler } from "react";
import Counter from "../components/Counter/Counter";
import { ToggleCheckbox } from "../components/FormElements/Checkbox/ToggleCheckbox";
import { RTE } from "./RTE/RTE";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { type ProjectDetailsSettingsLocales } from "~/routes/project/$slug/settings/details.server";
import { type ProjectRequirementsSettingsLocales } from "~/routes/project/$slug/settings/requirements.server";
import { type GeneralOrganizationSettingsLocales } from "~/routes/organization/$slug/settings/general.server";
import { type GeneralOrganizationSettingsLocales as NextGeneralOrganizationSettingsLocales } from "~/routes/next/organization/$slug/settings/general.server";
import { type GeneralEventSettingsLocales } from "~/routes/event/$slug/settings/general.server";
import { type GeneralProfileSettingsLocales } from "~/routes/profile/$username/settings/general.server";
import { type EventDocumentsSettingsLocales } from "~/routes/event/$slug/settings/documents.server";

export interface TextAreaProps {
  id: string;
  label: string;
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  errorMessage?: string;
  publicPosition?: "top" | "side";
  rte?: {
    locales:
      | GeneralProfileSettingsLocales
      | GeneralOrganizationSettingsLocales
      | NextGeneralOrganizationSettingsLocales
      | ProjectDetailsSettingsLocales
      | ProjectRequirementsSettingsLocales
      | GeneralEventSettingsLocales
      | EventDocumentsSettingsLocales;
  };
  helperText?: string;
}

const TextArea = (
  props: Omit<React.HTMLProps<HTMLTextAreaElement | HTMLInputElement>, "ref"> &
    TextAreaProps
) => {
  const {
    id,
    isPublic,
    withPublicPrivateToggle,
    placeholder,
    errorMessage,
    publicPosition = "side",
    rte,
    maxLength,
    defaultValue = "",
    helperText,
    onChange: defaultOnChange,
    ...rest
  } = props;
  const { value, className, readOnly, tabIndex, ...rteInputProps } = rest;

  const [characterCount, updateCharacterCount] = React.useState(
    props.defaultValue?.toString().length || 0
  );

  const handleTextAreaChange: FormEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    event.preventDefault();
    if (defaultOnChange) {
      defaultOnChange(event);
    }
    let tmpValue = event.currentTarget.value;
    const currentLength = event.currentTarget.value.length;
    if (maxLength !== undefined && currentLength > maxLength) {
      // Check the delta to also cut copy paste input
      const delta = currentLength - maxLength;
      // Use slice to cut the string right were the cursor currently is at (Thats the place were to many characters got inserted, so there they have to be removed)
      const currentCursorIndex = event.currentTarget.selectionEnd;
      tmpValue = `${tmpValue.slice(
        0,
        currentCursorIndex - delta
      )}${tmpValue.slice(currentCursorIndex, currentLength)}`;

      event.currentTarget.value = tmpValue;
      event.currentTarget.selectionEnd = currentCursorIndex - delta;
    }
    updateCharacterCount(tmpValue.length);
  };

  const counterContainerClasses = classNames(
    "mv-flex mv-w-full mv-mt-2",
    helperText === undefined && maxLength !== undefined
      ? "mv-justify-end"
      : "mv-justify-between"
  );

  return (
    <>
      <div className="mv-flex mv-flex-col mv-w-full">
        <div className="form-control w-full">
          <div className="flex flex-row items-center mb-2">
            <label htmlFor={id} className="label flex-auto">
              {props.label}
              {props.required === true ? " *" : ""}
            </label>

            {withPublicPrivateToggle !== undefined &&
              isPublic !== undefined &&
              publicPosition === "top" && (
                <ToggleCheckbox
                  name="privateFields"
                  value={props.name}
                  hidden={!withPublicPrivateToggle}
                  defaultChecked={!isPublic}
                />
              )}
          </div>
          <div className="flex flex-row">
            <div className="flex-auto">
              {rte !== undefined ? (
                <>
                  <RTE
                    {...rteInputProps}
                    id={id}
                    maxLength={maxLength}
                    defaultValue={defaultValue}
                    placeholder="Enter your text here"
                    locales={rte.locales}
                  />
                  <noscript>
                    <textarea
                      {...rest}
                      id={id}
                      maxLength={maxLength}
                      // removeHtmlTags is just for the edge case that someone used RTE already and then turned javascript off at one point.
                      // We will stay consistent on using rich text for specific fields in the database.
                      defaultValue={removeHtmlTags(String(defaultValue))}
                      className={`textarea textarea-bordered h-24 w-full ${props.className}`}
                    />
                  </noscript>
                </>
              ) : null}
              {rte === undefined ? (
                <textarea
                  {...rest}
                  id={id}
                  maxLength={maxLength}
                  // removeHtmlTags is just for the edge case that someone used RTE already and then turned javascript off at one point.
                  // We will stay consistent on using rich text for specific fields in the database.
                  defaultValue={defaultValue}
                  onChange={
                    maxLength !== undefined ? handleTextAreaChange : undefined
                  }
                  className={`textarea textarea-bordered h-24 w-full${
                    props.className === undefined ? "" : ` ${props.className}`
                  }`}
                />
              ) : null}
            </div>
            {withPublicPrivateToggle !== undefined &&
              props.isPublic !== undefined &&
              publicPosition === "side" && (
                <ToggleCheckbox
                  name="privateFields"
                  value={props.name}
                  hidden={!withPublicPrivateToggle}
                  defaultChecked={!isPublic}
                />
              )}
          </div>
        </div>
        {(maxLength !== undefined || helperText !== undefined) && (
          <div className={counterContainerClasses}>
            {helperText !== undefined && (
              <div className="mv-text-sm mv-text-gray-700 mv-pr-8">
                {helperText}
              </div>
            )}
            {maxLength !== undefined && rte === undefined && (
              <Counter currentCount={characterCount} maxCount={maxLength} />
            )}
          </div>
        )}
        {errorMessage !== undefined && (
          <div className="mv-text-sm mv-font-semibold mv-text-negative-600 mv-mt-2">
            {errorMessage}
          </div>
        )}
      </div>
    </>
  );
};

export { TextArea };
