import { useEffect, useRef, useState } from "react";

export interface SearchProps {
  query?: string | null;
}

function Search(props: React.HTMLProps<HTMLInputElement> & SearchProps) {
  const [value, setValue] = useState(props.query || "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { ...inputProps } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setValue(query);
  };

  const handleClear = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setValue("");
  };

  useEffect(() => {
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (evt: any) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key === "k") {
        if (inputRef.current !== null) {
          inputRef.current.focus();
        }
      }
    };
    if (window) {
      window.addEventListener("keydown", handler);
    }
    return () => {
      if (window) {
        window.removeEventListener("keydown", handler);
      }
    };
  }, []);

  return (
    <div className="mv-flex mv-flex-col mv-gap-2 mv-w-full">
      <div className="mv-relative">
        <div className="mv-absolute mv-left-4 mv-top-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
            <path
              fill="#3C4658"
              fillRule="nonzero"
              d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1ZM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"
            />
          </svg>
        </div>
        <input
          className="mv-w-full mv-outline-none mv-bg-neutral-100 mv-h-auto mv-min-w-[230px] mv-rounded-lg mv-border-2 mv-border-neutral-100 mv-py-2 mv-pl-10 mv-pr-4 mv-text-sm mv-font-semibold mv-appearance-none mv-leading-6 focus:mv-border-primary"
          placeholder={inputProps.placeholder || "Suche (mind. 3 Buchstaben)"}
          minLength={inputProps.minLength || 3}
          value={value}
          onChange={handleChange}
          ref={inputRef}
          {...inputProps}
        />
        {value.length > 0 && (
          <div className="mv-absolute mv-right-0 mv-top-0.5">
            <button className="mv-p-4" type="reset" onClick={handleClear}>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
