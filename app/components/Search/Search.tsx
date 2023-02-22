import React from "react";

export interface SearchProps {
  query?: string | null;
}

function Search(props: React.HTMLProps<HTMLInputElement> & SearchProps) {
  const [value, setValue] = React.useState(props.query || "");

  const {
    placeholder = "Suche (mind. 3 Buchstaben)",
    minLength = 3,
    ...inputProps
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setValue(query);
  };

  const handleClear = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setValue("");
  };

  return (
    <div className="form-control w-full">
      <div className="flex items-center">
        <input
          className="w-full input bg-gray-300 pr-3"
          placeholder={placeholder}
          minLength={minLength}
          value={value}
          onChange={handleChange}
          {...inputProps}
        />
        {value.length > 0 && (
          <button className="-ml-3" type="reset" onClick={handleClear}>
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
        )}
      </div>
    </div>
  );
}

export default Search;
