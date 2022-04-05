export interface OptionsProps {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  label: string;
  id?: string;
  isRequired?: boolean;
  options?: OptionsProps[];
}

function SelectField(props: SelectFieldProps) {
  const id = props.id ?? props.label;

  return (
    <div className="form-control w-full">
      <label htmlFor={id} className="label">
        {props.label}
        {props.isRequired ? " *" : ""}
      </label>
      {/* TODO: add selected class on change */}
      <select id={id} className="select select-bordered">
        <option disabled selected></option>
        {props.options.map((option, index) => (
          <option value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

export default SelectField;
