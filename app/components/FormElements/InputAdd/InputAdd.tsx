import * as React from "react";
import { capitalizeFirstLetter } from "../../../lib/string/transform";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";

export interface InputAddProps {
  name: string;
  label: string;
  entries: string[];
  isPublic?: boolean;
  withPublicPrivateToggle?: boolean;
}

function InputAdd(props: React.HTMLProps<HTMLInputElement> & InputAddProps) {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const { label, isPublic, ...rest } = props;
  const entries = props.entries ?? [];
  const id = props.id ?? props.name;
  const name = props.name ?? "";
  const singularName = name.slice(0, -1);
  const uppercaseSingularName = capitalizeFirstLetter(singularName);

  return (
    <>
      <div className="form-control w-full">
        <div className="flex flex-row items-center mb-2">
          <div className="flex-auto">
            {props.label && (
              <label htmlFor={id} className="label">
                {props.label}
                {props.required !== undefined ? " *" : ""}
              </label>
            )}
          </div>

          {isPublic !== undefined &&
            props.withPublicPrivateToggle !== undefined && (
              <ToggleCheckbox
                name="privateFields"
                value={props.name}
                hidden={!props.withPublicPrivateToggle}
                defaultChecked={!isPublic}
              />
            )}
        </div>

        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <input
              {...rest}
              name={`add${uppercaseSingularName}`}
              type="text"
              className={`clear-after-submit input input-bordered input-lg w-full ${
                props.className ?? ""
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  buttonRef.current?.click();
                }
              }}
            />
          </div>

          <div className="ml-2">
            <button
              ref={buttonRef}
              name="submit"
              type="submit"
              className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600"
              value={`add${uppercaseSingularName}`}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <ul className="pt-2">
        {entries.map((entry) => (
          <li key={`${name}-${entry}`} className="flex">
            <div className="font-bold  py-2">
              {entry}
              <input name={name} type="hidden" value={entry} />
            </div>

            <button
              type="submit"
              name={`remove${uppercaseSingularName}`}
              value={entry}
              className="ml-auto btn-none"
              title="entfernen"
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
