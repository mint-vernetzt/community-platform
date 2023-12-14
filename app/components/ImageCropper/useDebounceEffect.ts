import { useEffect, type DependencyList } from "react";

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps?: DependencyList
) {
  useEffect(() => {
    const t = setTimeout(() => {
      // TODO: fix type issue and fix eslint error
      // @ts-ignore
      fn.apply(undefined, deps); // eslint-disable-line prefer-spread
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, deps);
}
