import classNames from "classnames";
import { useEffect, useState } from "react";

export type AlertLevel = "positive" | "attention" | "negative";

export type AlertProps = {
  children: React.ReactNode;
  level?: AlertLevel;
};

export function Alert(props: AlertProps) {
  const { level = "positive" } = props;
  const [show, setShow] = useState(true);

  const handleClick = () => {
    setShow(false);
  };

  useEffect(() => {
    setShow(true);
  }, [props]);

  if (!show) {
    return null;
  }

  const classes = classNames(
    "mv-w-full mv-px-4 mv-py-2 mv-flex mv-justify-end mv-gap-2 mv-text-sm mv-font-semibold mv-rounded",
    level === "positive" && "mv-bg-positive-200 mv-text-positive-900",
    level === "attention" && "mv-bg-attention-200 mv-text-attention-900",
    level === "negative" && "mv-bg-negative-100 mv-text-negative-900"
  );

  return (
    <div className={classes}>
      <div className="mv-w-full mv-text-center mv-truncate">
        {props.children}
      </div>
      <button onClick={handleClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5.80749 5.80749C5.86554 5.74928 5.93451 5.7031 6.01045 5.6716C6.08638 5.64009 6.16778 5.62387 6.24999 5.62387C6.3322 5.62387 6.4136 5.64009 6.48953 5.6716C6.56546 5.7031 6.63443 5.74928 6.69249 5.80749L9.99999 9.11624L13.3075 5.80749C13.3656 5.74938 13.4346 5.70328 13.5105 5.67183C13.5864 5.64038 13.6678 5.6242 13.75 5.6242C13.8322 5.6242 13.9135 5.64038 13.9895 5.67183C14.0654 5.70328 14.1344 5.74938 14.1925 5.80749C14.2506 5.8656 14.2967 5.93458 14.3281 6.01051C14.3596 6.08643 14.3758 6.16781 14.3758 6.24999C14.3758 6.33217 14.3596 6.41354 14.3281 6.48947C14.2967 6.56539 14.2506 6.63438 14.1925 6.69249L10.8837 9.99999L14.1925 13.3075C14.2506 13.3656 14.2967 13.4346 14.3281 13.5105C14.3596 13.5864 14.3758 13.6678 14.3758 13.75C14.3758 13.8322 14.3596 13.9135 14.3281 13.9895C14.2967 14.0654 14.2506 14.1344 14.1925 14.1925C14.1344 14.2506 14.0654 14.2967 13.9895 14.3281C13.9135 14.3596 13.8322 14.3758 13.75 14.3758C13.6678 14.3758 13.5864 14.3596 13.5105 14.3281C13.4346 14.2967 13.3656 14.2506 13.3075 14.1925L9.99999 10.8837L6.69249 14.1925C6.63438 14.2506 6.56539 14.2967 6.48947 14.3281C6.41354 14.3596 6.33217 14.3758 6.24999 14.3758C6.16781 14.3758 6.08643 14.3596 6.01051 14.3281C5.93458 14.2967 5.8656 14.2506 5.80749 14.1925C5.74938 14.1344 5.70328 14.0654 5.67183 13.9895C5.64038 13.9135 5.6242 13.8322 5.6242 13.75C5.6242 13.6678 5.64038 13.5864 5.67183 13.5105C5.70328 13.4346 5.74938 13.3656 5.80749 13.3075L9.11624 9.99999L5.80749 6.69249C5.74928 6.63443 5.7031 6.56546 5.6716 6.48953C5.64009 6.4136 5.62387 6.3322 5.62387 6.24999C5.62387 6.16778 5.64009 6.08638 5.6716 6.01045C5.7031 5.93451 5.74928 5.86554 5.80749 5.80749Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
