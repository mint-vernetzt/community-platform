import { createRef } from "react";
import { capitalizeFirstLetter } from "../../../lib/string/transform";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export interface InputAddProps {
  label: string;
  entries: string[];
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
}

function InputAdd(props: React.HTMLProps<HTMLInputElement> & InputAddProps) {
  const buttonRef = createRef<HTMLButtonElement>();
  const {
    label,
    entries = [],
    isPublic,
    withPublicPrivateToggle,
    ...inputProps
  } = props;
  const singularName = (inputProps.name || "").slice(0, -1);
  const uppercaseSingularName = capitalizeFirstLetter(singularName);
  const isSubmitting = useIsSubmitting();

  return (
    <>
      <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
        <div className="mv-flex mv-flex-row mv-items-center mv-mb-2">
          <div className="mv-flex-auto">
            {label && (
              <label
                htmlFor={inputProps.id || label}
                className="mv-font-semibold"
              >
                {label}
                {inputProps.required !== undefined ? " *" : ""}
              </label>
            )}
          </div>

          {isPublic !== undefined && withPublicPrivateToggle !== undefined && (
            <ToggleCheckbox
              name="privateFields"
              value={inputProps.name}
              hidden={!withPublicPrivateToggle}
              defaultChecked={!isPublic}
            />
          )}
        </div>

        <div className="mv-flex mv-flex-row mv-items-center">
          <div className="mv-flex-auto">
            <input
              {...inputProps}
              name={`add${uppercaseSingularName}`}
              type="text"
              className={`clear-after-submit mv-w-full mv-outline-none mv-bg-white mv-h-auto mv-border-2 mv-border-neutral-300 mv-px-4 mv-text-base mv-font-semibold mv-leading-8 mv-appearance-none mv-rounded-lg focus:mv-border-neutral-200 ${
                inputProps.className ?? ""
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buttonRef.current?.click();
                }
              }}
            />
          </div>

          <div className="mv-ml-2">
            <button
              ref={buttonRef}
              name="submit"
              type="submit"
              className="mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border-2 mv-border-neutral-300 mv-text-neutral-600 hover:mv-bg-neutral-100"
              value={`add${uppercaseSingularName}`}
              disabled={isSubmitting}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <ul className="mv-pt-2">
        {entries.map((entry) => (
          <li key={`${inputProps.name || label}-${entry}`} className="mv-flex">
            <div className="mv-font-bold  mv-py-2">
              {entry}
              <input
                name={inputProps.name || label}
                type="hidden"
                value={entry}
              />
            </div>

            <button
              type="submit"
              name={`remove${uppercaseSingularName}`}
              value={entry}
              className="mv-ml-auto mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-transparent mv-text-neutral-600"
              title="entfernen"
              disabled={isSubmitting}
            >
              <svg
                viewBox="0 0 10 10"
                width="10px"
                height="10px"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default InputAdd;
