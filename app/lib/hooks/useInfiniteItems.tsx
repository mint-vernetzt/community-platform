import { useFetcher } from "@remix-run/react";
import React from "react";

export function useInfiniteItems(
  initialItems: any[],
  route: string,
  key: string
) {
  const [items, setItems] = React.useState(initialItems);
  const [page, setPage] = React.useState(2);
  const fetcher = useFetcher();

  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [clientHeight, setClientHeight] = React.useState(0);
  const [height, setHeight] = React.useState<number | null>(null);
  const [shouldFetch, setShouldFetch] = React.useState(true);

  const refCallback = React.useCallback(
    (node: HTMLDivElement) => {
      if (node !== null) {
        setHeight(node.getBoundingClientRect().height);
      }
    },
    // eslint-disable-next-line
    [items.length]
  );

  React.useEffect(() => {
    const scrollListener = () => {
      setClientHeight(window.innerHeight);
      setScrollPosition(window.scrollY);
    };

    if (typeof window !== "undefined") {
      setClientHeight(window.innerHeight);
      setScrollPosition(window.scrollY);
      window.addEventListener("scroll", scrollListener);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", scrollListener);
      }
    };
  }, []);

  React.useEffect(() => {
    if (shouldFetch === false || height === null) {
      return;
    }

    if (clientHeight + scrollPosition > height) {
      fetcher.load(`${route}?page=${page}`);
      setShouldFetch(false);
    }

    //eslint-disable-next-line
  }, [clientHeight, scrollPosition]);

  React.useEffect(() => {
    if (fetcher.data !== undefined && fetcher.data[key].length === 0) {
      setShouldFetch(false);
      return;
    }

    if (fetcher.data !== undefined && fetcher.data[key].length > 0) {
      setItems((prevItems) => [...prevItems, ...fetcher.data[key]]);
      setPage((page: number) => page + 1);
      setShouldFetch(true);
    }
  }, [fetcher.data]);

  return { refCallback, items };
}
