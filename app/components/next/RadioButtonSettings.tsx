import classNames from "classnames";
import { Link, type LinkProps } from "react-router";

// Design:
// Name: Radio Buttons+Container (Settings)
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10516-10819&t=XCyCGrELG3KTCjAt-4

function RadioButtonSettings(
  props: { children: React.ReactNode; active: boolean } & LinkProps &
    React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  const { children, active, ...linkProps } = props;

  const classes = classNames(
    "w-full p-4 rounded-lg hover:bg-neutral-100 ring focus:outline-none focus:ring-2 focus:ring-primary-200",
    active ? "ring-primary-700" : "ring-neutral-300"
  );

  return (
    <Link className={classes} {...linkProps}>
      <div className="w-full flex gap-2 items-center">
        <div className="w-5 h-5 rounded-full bg-white border border-neutral-700 flex items-center justify-center">
          {active ? (
            <div className="w-3.5 h-3.5 rounded-full bg-primary-700 border border-neutral-700" />
          ) : null}
        </div>
        {children}
      </div>
    </Link>
  );
}

// TODO: Merge both variants

function RadioSubmitButtonSettings(props: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  name: string;
  value: string;
}) {
  const { children, active = false, disabled = false, name, value } = props;

  const buttonClasses = classNames(
    "w-full p-4 rounded-lg ring",
    disabled
      ? "ring-neutral-200 text-neutral-300"
      : "cursor-pointer hover:bg-neutral-100 ring focus:outline-none focus:ring-2 focus:ring-primary-200 text-neutral-700"
  );

  const radioClasses = classNames(
    "w-5 h-5 rounded-full bg-white border flex items-center justify-center",
    disabled ? "border-neutral-400" : "border-neutral-700"
  );

  const indicatorClasses = classNames(
    "w-3.5 h-3.5 rounded-full border",
    disabled
      ? "bg-neutral-400 border-neutral-400"
      : "bg-primary-700 border-neutral-700"
  );

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled}
      className={buttonClasses}
      onClick={(event) => {
        if (active) {
          event.preventDefault();
        }
      }}
    >
      <div className="w-full flex gap-2 items-center">
        <div className={radioClasses}>
          {active && <div className={indicatorClasses} />}
        </div>
        <div className="inline-flex flex-col items-start ">{children}</div>
      </div>
    </button>
  );
}

function RadioButtonSubmitSettingsTitle(props: { children: React.ReactNode }) {
  return <span className="font-semibold">{props.children}</span>;
}

function RadioButtonSubmitSettingsSubline(props: {
  children: React.ReactNode;
}) {
  return <span className="text-sm">{props.children}</span>;
}

RadioSubmitButtonSettings.Title = RadioButtonSubmitSettingsTitle;
RadioSubmitButtonSettings.Subline = RadioButtonSubmitSettingsSubline;

export { RadioSubmitButtonSettings };

export default RadioButtonSettings;
