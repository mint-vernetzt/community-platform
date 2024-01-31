import React from "react";
import { type CountUpProps, useCountUp } from "react-countup";

function CountUp(props: CountUpProps) {
  const ref = React.useRef(null);
  useCountUp({
    ref,
    ...props,
  });

  return <span ref={ref}></span>;
}

export { CountUp };
