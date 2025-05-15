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
  const { level = "positive", delay = 2000, onHide } = props;
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
    "mv-px-4 mv-py-1.5 mv-rounded mv-font-semibold mv-text-sm mv-text-center",
    level === "positive" && "mv-bg-positive-200 mv-text-positive-900",
    level === "attention" && "mv-bg-attention-200 mv-text-attention-900",
    level === "negative" && "mv-bg-negative-100 mv-text-negative-900",
    level === "neutral" && "mv-bg-primary-50 mv-text-primary-700",
    hide && "mv-hidden"
  );

  return hide ? null : (
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

export { Toast };
