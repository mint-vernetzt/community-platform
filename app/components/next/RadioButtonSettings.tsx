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

export default RadioButtonSettings;
