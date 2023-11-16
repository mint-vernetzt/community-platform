import classNames from "classnames";
import React from "react";

export type ToastLevel = "positive" | "attention" | "negative";

export type ToastProps = {
  level?: ToastLevel;
  delay?: number;
  onHide?: () => void;
  id?: string;
};

function Toast(props: React.PropsWithChildren<ToastProps>) {
  const { level = "positive", delay = 2000 } = props;
  const [hide, setHide] = React.useState(true);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    timeout = setTimeout(() => {
      if (typeof props.onHide !== "undefined") {
        props.onHide();
      }
      setHide(true);
    }, delay);
    setHide(false);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const classes = classNames(
    "mv-px-4 mv-py-1.5 mv-rounded mv-font-semibold mv-text-sm mv-text-center",
    level === "positive" && "mv-bg-positive-200 mv-text-positive-900",
    level === "attention" && "mv-bg-attention-200 mv-text-attention-900",
    level === "negative" && "mv-bg-negative-100 mv-text-negative-900",
    hide && "mv-hidden"
  );

  return (
    <div id={props.id}>
      <noscript>
        <div className={classes.replace(" mv-hidden", "")}>
          {props.children}
        </div>
      </noscript>
      <div className={classes}>{props.children}</div>
    </div>
  );
}

export default Toast;
