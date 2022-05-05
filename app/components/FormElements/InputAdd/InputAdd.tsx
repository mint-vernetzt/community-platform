import * as React from "react";
import { capitalizeFirstLetter } from "~/lib/string/transform";
import { ToggleCheckbox } from "../Checkbox/ToggleCheckbox";

export interface InputAddProps {
  name: string;
  label: string;
  entries: string[];
  isPublic?: boolean;
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

          {isPublic !== undefined && (
            <ToggleCheckbox
              name="publicFields"
              value={props.name}
              defaultChecked={isPublic}
            />
          )}
        </div>

        <div className="flex flex-row items-center">
          <div className="flex-auto">
            <input
              {...rest}
              name={`add${uppercaseSingularName}`}
              type="text"
              className={`clear-after-submit input input-bordered w-full ${
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
      <ul className="pt-6 pb-12">
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
                fill="none"
                height="9"
                viewBox="0 0 10 9"
                width="10"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m.80764.307518c.058057-.058204.127027-.104383.20296-.135891.07593-.031508.15733-.047726.23954-.047726s.16361.016218.23954.047726.1449.077687.20296.135891l3.3075 3.308752 3.3075-3.308752c.05811-.05811.1271-.104205.20302-.135654.07593-.031449.1573-.047635.23948-.047635s.16356.016186.23948.047635.14491.077544.20302.135654.10421.127097.13565.203021c.03145.075924.04764.1573.04764.239479 0 .08218-.01619.163556-.04764.23948-.03144.075922-.07754.144912-.13565.203022l-3.30875 3.3075 3.30875 3.3075c.05811.05811.10421.12709.13565.20302.03145.07592.04764.1573.04764.23948s-.01619.16355-.04764.23948c-.03144.07592-.07754.14491-.13565.20302s-.1271.1042-.20302.13565-.1573.04764-.23948.04764-.16355-.01619-.23948-.04764c-.07592-.03145-.14491-.07754-.20302-.13565l-3.3075-3.30875-3.3075 3.30875c-.05811.05811-.1271.1042-.20302.13565s-.1573.04764-.23948.04764-.16355-.01619-.23948-.04764c-.075923-.03145-.14491-.07754-.20302-.13565s-.104205-.1271-.135654-.20302c-.031449-.07593-.047635-.1573-.047635-.23948s.016186-.16356.047635-.23948c.031449-.07593.077544-.14491.135654-.20302l3.30875-3.3075-3.30875-3.3075c-.058204-.05806-.104382-.12703-.135891-.20296-.031508-.075931-.047726-.157333-.047726-.239542s.016218-.16361.047726-.239542c.031509-.075931.077687-.144901.135891-.202958z"
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
