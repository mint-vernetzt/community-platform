import { useFetcher } from "react-router";
import React from "react";

export function useInfiniteItems(
  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialItems: any[],
  route: string,
  key: string,
  searchParams?: URLSearchParams
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.length]
  );

  React.useEffect(() => {
    setShouldFetch(true);
    setItems(initialItems);
    setPage(2);
  }, [initialItems]);

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
      let searchParamsQuery = "";
      if (searchParams !== undefined) {
        searchParams.forEach((value, key) => {
          if (key !== "page") {
            searchParamsQuery += `&${key}=${value}`;
          }
        });
      }
      fetcher.load(`${route}page=${page}${searchParamsQuery}`);
      setShouldFetch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientHeight, scrollPosition]);

  React.useEffect(() => {
    if (
      fetcher.data !== undefined &&
      fetcher.data !== null &&
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fetcher.data[key].length === 0
    ) {
      setShouldFetch(false);
      return;
    }
    if (
      fetcher.data !== undefined &&
      fetcher.data !== null &&
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      fetcher.data[key].length > 0
    ) {
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setItems((prevItems) => [...prevItems, ...fetcher.data[key]]);
      setPage((page: number) => page + 1);
      setShouldFetch(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data]);

  return { refCallback, items };
}
