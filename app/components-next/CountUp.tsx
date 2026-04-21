import { useEffect, useRef } from "react";
import { useCountUp, type CountUpProps } from "react-countup";

export function CountUp(props: CountUpProps) {
  const {
    autoAnimate = true,
    autoAnimateDelay = 100,
    autoAnimateOnce = true,
    start = 0,
    ...countUpProps
  } = props;

  const ref = useRef<HTMLElement | null>(null);
  const { start: startCountUp } = useCountUp({
    ref: ref as React.RefObject<HTMLElement>,
    separator: ".",
    startOnMount: autoAnimate === false,
    start: 0,
    autoAnimate,
    autoAnimateDelay,
    autoAnimateOnce,
    ...countUpProps,
  });

  useEffect(() => {
    const element = ref.current;
    if (element === null || autoAnimate === false) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            startCountUp();
          }, autoAnimateDelay);
          if (autoAnimateOnce === true) {
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [startCountUp, autoAnimate, autoAnimateDelay, autoAnimateOnce]);

  return <span ref={ref}>{start}</span>;
}
