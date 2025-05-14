import { Fragment } from "react";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";

export interface OptionsProps {
  label: string;
  value: string;
}

export interface OptGroupProps {
  label: string;
  options: OptionsProps[];
}

export type OptionOrGroup = OptionsProps | OptGroupProps;

export interface SelectFieldProps {
  label: string;
  options?: OptionOrGroup[];
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
  publicPosition?: "top" | "side";
  visibilityName?: string;
}

function SelectField(
  props: React.HTMLProps<HTMLSelectElement> & SelectFieldProps
) {
  const {
    label,
    options = [],
    isPublic,
    withPublicPrivateToggle,
    publicPosition = "side",
    visibilityName,
    ...selectProps
  } = props;

  return (
    <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
      <div className="mv-flex mv-flex-row mv-items-center mv-mb-2">
        <label
          htmlFor={selectProps.id}
          className="mv-font-semibold mv-flex-auto"
        >
          {label}
          {selectProps.required === true ? " *" : ""}
        </label>
        {withPublicPrivateToggle !== undefined &&
          isPublic !== undefined &&
          publicPosition === "top" && (
            <ToggleCheckbox
              name="privateFields"
              value={visibilityName ?? selectProps.name}
              hidden={!withPublicPrivateToggle}
              defaultChecked={!isPublic}
            />
          )}
      </div>
      <div className="mv-flex mv-flex-row mv-items-center">
        <div className="mv-flex-auto mv-relative">
          <select
            {...selectProps}
            className={`mv-w-full mv-outline-none mv-h-auto mv-border-2 mv-border-neutral-300 mv-px-4 mv-text-base mv-font-semibold mv-leading-8 mv-appearance-none mv-rounded-lg focus:mv-border-neutral-200 mv-bg-neutral-100 focus:mv-bg-white mv-cursor-pointer ${
              selectProps.className ?? ""
            }`}
          >
            <option></option>
            {options.map((option, index) => (
              <Fragment key={index}>
                {"value" in option && (
                  <option
                    key={`${selectProps.id}-option-${index}`}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )}

                {"options" in option && (
                  <optgroup
                    key={`${selectProps.id}-option-${index}`}
                    label={option.label}
                  >
                    {option.options.map((groupOption, groupOptionIndex) => (
                      <option
                        key={`${selectProps.id}-option-${index}-${groupOptionIndex}`}
                        value={groupOption.value}
                      >
                        {groupOption.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Fragment>
            ))}
          </select>
          <div className="mv-absolute mv-right-2 mv-top-2 mv-rotate-90 mv-pointer-events-none">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
                fill="#454C5C"
              ></path>
              <path
                d="M7.12588 14.887C7.08598 14.8513 7.05432 14.8089 7.03272 14.7621C7.01112 14.7154 7 14.6653 7 14.6147C7 14.5642 7.01112 14.5141 7.03272 14.4673C7.05432 14.4206 7.08598 14.3782 7.12588 14.3425L11.9649 9.9999L7.12588 5.65733C7.08604 5.62158 7.05444 5.57913 7.03288 5.53241C7.01132 5.48569 7.00022 5.43562 7.00022 5.38506C7.00022 5.33449 7.01132 5.28442 7.03288 5.2377C7.05444 5.19098 7.08604 5.14854 7.12588 5.11278C7.16571 5.07702 7.21301 5.04866 7.26506 5.02931C7.3171 5.00996 7.37289 5 7.42923 5C7.48557 5 7.54135 5.00996 7.5934 5.02931C7.64545 5.04866 7.69274 5.07702 7.73258 5.11278L12.8741 9.72762C12.914 9.76335 12.9457 9.80578 12.9673 9.85251C12.9889 9.89923 13 9.94932 13 9.9999C13 10.0505 12.9889 10.1006 12.9673 10.1473C12.9457 10.194 12.914 10.2365 12.8741 10.2722L7.73258 14.887C7.69278 14.9228 7.6455 14.9512 7.59344 14.9706C7.54139 14.99 7.48559 15 7.42923 15C7.37287 15 7.31707 14.99 7.26501 14.9706C7.21296 14.9512 7.16568 14.9228 7.12588 14.887Z"
                stroke="#454C5C"
              ></path>
            </svg>
          </div>
        </div>

        {withPublicPrivateToggle !== undefined &&
          isPublic !== undefined &&
          publicPosition === "side" && (
            <ToggleCheckbox
              name="privateFields"
              value={selectProps.name}
              hidden={!withPublicPrivateToggle}
              defaultChecked={!isPublic}
            />
          )}
      </div>
    </div>
  );
}

export default SelectField;
