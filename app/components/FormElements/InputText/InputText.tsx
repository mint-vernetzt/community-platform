export interface InputTextProps {
  label: string;
  id?: string;
  placeholder?: string;
  isRequired?: boolean;
}

function InputText(props: InputTextProps) {
  const id = props.id ?? props.label;
  const placeholder = props.placeholder ?? " ";

  return (
    <div className="form-control w-full">
      <label htmlFor={id} className="label">
        {props.label}
        {props.isRequired ? " *" : ""}
      </label>
      {/* TODO: add required attribute if necessary */}
      <input
        type="text"
        id={id}
        name={id}
        placeholder={placeholder}
        className="input input-bordered w-full"
      />
    </div>
  );
}

export default InputText;
