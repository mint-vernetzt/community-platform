import { useEffect, useRef } from "react";
import { useCountUp, type CountUpProps } from "react-countup";

export function CountUp(
  props: CountUpProps & {
    triggerOn?: "visible" | "mount";
  }
) {
  const { triggerOn = "visible", ...countUpProps } = props;

  const ref = useRef<HTMLElement | null>(null);
  const { start } = useCountUp({
    ref: ref as React.RefObject<HTMLElement>,
    separator: ".",
    startOnMount: triggerOn === "mount",
    ...countUpProps,
  });

  useEffect(() => {
    const element = ref.current;
    if (element === null || triggerOn === "mount") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [start, triggerOn]);

  return <span ref={ref}></span>;
}
