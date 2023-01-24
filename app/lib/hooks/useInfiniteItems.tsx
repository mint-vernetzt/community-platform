import { useFetcher } from "@remix-run/react";
import React from "react";

export function useInfiniteItems(
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
        console.log("set height", node.getBoundingClientRect().height);
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
    console.log("SCROLL LISTENER HOOK");

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
    console.log("FETCH HOOK");
    if (clientHeight + scrollPosition > height) {
      let searchParamsQuery = "";
      if (searchParams !== undefined) {
        searchParams.forEach((value, key) => {
          searchParamsQuery += `&${key}=${value}`;
        });
      }
      console.log(`load ${route}?page=${page}${searchParamsQuery}`);
      fetcher.load(`${route}?page=${page}${searchParamsQuery}`);
      setShouldFetch(false);
    }
  }, [clientHeight, scrollPosition]);

  React.useEffect(() => {
    if (fetcher.data !== undefined && fetcher.data[key].length === 0) {
      console.log("nothing to fetch");
      setShouldFetch(false);
      return;
    }
    if (fetcher.data !== undefined && fetcher.data[key].length > 0) {
      console.log("set items");
      setItems((prevItems) => [...prevItems, ...fetcher.data[key]]);
      setPage((page: number) => page + 1);
      setShouldFetch(true);
    }
  }, [fetcher.data]);

  return { refCallback, items };
}
