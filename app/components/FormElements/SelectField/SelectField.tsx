export interface OptionsProps {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  label: string;
  options?: OptionsProps[];
}

function SelectField(
  props: React.HTMLProps<HTMLSelectElement> & SelectFieldProps
) {
  const { id, label, options = [], ...rest } = props;

  return (
    <div className="form-control w-full">
      <label htmlFor={id} className="label">
        {label}
        {props.required === true ? " *" : ""}
      </label>
      {/* TODO: add selected class on change */}
      <select {...rest} className={`select select-bordered ${props.className}`}>
        <option></option>
        {options.map((option, index) => (
          <option key={`${id}-option-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectField;
