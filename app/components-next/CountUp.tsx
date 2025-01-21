import React from "react";
import { useCountUp, type CountUpProps } from "react-countup";

export function CountUp(props: CountUpProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  useCountUp({
    ref: ref as React.RefObject<HTMLElement>,
    ...props,
  });

  return <span ref={ref}></span>;
}
