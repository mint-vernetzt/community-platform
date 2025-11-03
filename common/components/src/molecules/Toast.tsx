import classNames from "classnames";
import { useEffect, useState } from "react";

export type ToastLevel = "neutral" | "positive" | "attention" | "negative";

type ToastProps = {
  level?: ToastLevel;
  delay?: number;
  onHide?: () => void;
  id?: string;
};

function Toast(props: React.PropsWithChildren<ToastProps>) {
  const { level = "positive", delay = 5000, onHide } = props;
  const [hide, setHide] = useState(true);

  useEffect(() => {
    const timeout: NodeJS.Timeout = setTimeout(() => {
      if (typeof onHide !== "undefined") {
        onHide();
      }
      setHide(true);
    }, delay);
    setHide(false);
    return () => {
      clearTimeout(timeout);
    };
  }, [onHide, delay]);

  const classes = classNames(
    "px-4 py-1.5 rounded-sm font-semibold text-sm text-center",
    level === "positive" && "bg-positive-200 text-positive-900",
    level === "attention" && "bg-attention-200 text-attention-900",
    level === "negative" && "bg-negative-100 text-negative-900",
    level === "neutral" && "bg-primary-50 text-primary-700",
    hide && "hidden"
  );

  return hide ? null : (
    <div id={props.id}>
      <noscript>
        <div className={classes.replace(" hidden", "")}>{props.children}</div>
      </noscript>
      <div className={classes}>{props.children}</div>
    </div>
  );
}

export { Toast };
