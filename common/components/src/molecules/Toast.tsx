import classNames from "classnames";
import React from "react";

export type ToastVariant = "positive" | "attention" | "negative";

export type ToastProps = {
  variant?: ToastVariant;
  delay?: number;
  onHide?: () => void;
};

function Toast(props: React.PropsWithChildren<ToastProps>) {
  const { variant = "positive", delay = 2000 } = props;
  const [hide, setHide] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!hide) {
      timeout = setTimeout(() => {
        if (typeof props.onHide !== "undefined") {
          props.onHide();
        }
        setHide(true);
      }, delay);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [hide, delay]);

  React.useEffect(() => {
    setHide(false);
  }, [props]);

  const classes = classNames(
    "mv-px-4 mv-py-1.5 mv-rounded mv-font-semibold mv-text-sm mv-text-center",
    variant === "positive" && "mv-bg-positive-200 mv-text-positive-900",
    variant === "attention" && "mv-bg-attention-200 mv-text-attention-900",
    variant === "negative" && "mv-bg-negative-100 mv-text-negative-900",
    hide && "mv-hidden"
  );

  return <div className={classes}>{props.children}</div>;
}

export default Toast;
