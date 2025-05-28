import { createRef } from "react";
import { capitalizeFirstLetter } from "../../../lib/string/transform";
import SelectField, { type SelectFieldProps } from "../SelectField/SelectField";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export type SelectAddEntry = {
  label: string;
  value: string;
};

export type SelectAddProps = React.HTMLProps<HTMLSelectElement> &
  SelectFieldProps & {
    name: string;
    entries?: SelectAddEntry[] | undefined;
  };

function SelectAdd(props: SelectAddProps) {
  const buttonRef = createRef<HTMLButtonElement>();
  const { name, entries = [], isPublic, ...selectProps } = props;
  const singularName = name.slice(0, -1);
  const uppercaseSingularName = capitalizeFirstLetter(singularName);
  const isSubmitting = useIsSubmitting();

  return (
    <div className="mv-mb-4">
      <div className="mv-flex mv-flex-row mv-items-center mv-w-full">
        <div className="mv-flex-auto">
          <SelectField
            name={`add${uppercaseSingularName}`}
            visibilityName={name}
            {...selectProps}
            onChange={(e: React.SyntheticEvent<HTMLSelectElement>) => {
              if (e.currentTarget.value && buttonRef.current !== null) {
                buttonRef.current.click();
              }
            }}
            className={`clear-after-submit`}
            isPublic={isPublic}
            publicPosition="top"
          />
        </div>
        {/* 
          Had to readd the button else it doesn't submit on Chrome: See https://github.com/mint-vernetzt/community-platform/issues/2088.
          Button ref was removed so onChange handler of SelectField doesn't work.
        */}
        <div>
          <button
            ref={buttonRef}
            value={`add${uppercaseSingularName}`}
            name="submit"
            type="submit"
            className="mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-neutral-500 mv-text-neutral-600 mv-hidden mv-ml-2"
            disabled={isSubmitting}
          >
            +
          </button>
        </div>
      </div>

      <ul className="mv-pt-2">
        {entries.map((entry) => (
          <li key={`${name}-${entry.value}`} className="mv-flex">
            <div className="mv-font-bold mv-py-2">
              {entry.label}
              <input name={name} type="hidden" value={entry.value} />
            </div>

            <button
              type="submit"
              name={`remove${uppercaseSingularName}`}
              value={entry.value}
              className="mv-ml-auto mv-bg-transparent mv-w-10 mv-h-8 mv-flex mv-items-center mv-justify-center mv-rounded-md mv-border mv-border-transparent mv-text-neutral-600"
              title="entfernen"
              disabled={isSubmitting}
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
    </div>
  );
}

export default SelectAdd;
