import * as React from "react";

export interface InputAddProps {
  label: string;
  handleAdd: (value: string) => void;
}

function InputAdd(props: React.HTMLProps<HTMLInputElement> & InputAddProps) {
  const ref = React.createRef<HTMLInputElement>();
  const { label, ...rest } = props;
  const id = props.id ?? props.label;

  const callHandleAdd = () => {
    if (ref.current) {
      let value = ref?.current?.value.trim() ?? "";
      if (value !== "") {
        props.handleAdd(value);
      }
      ref.current.value = "";
    }
  };

  return (
    <div className="form-control w-full">
      {props.label && (
        <label htmlFor={id} className="label">
          {props.label}
          {props.required !== undefined ? " *" : ""}
        </label>
      )}

      <div className="flex flex-row items-center">
        <div className="flex-auto">
          <input
            {...rest}
            ref={ref}
            type="text"
            className={`input input-bordered w-full ${props.className}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                callHandleAdd();
              }
            }}
          />
        </div>

        <div className="ml-2">
          <button
            className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600"
            onClick={(e) => {
              e.preventDefault();
              callHandleAdd();
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default InputAdd;
