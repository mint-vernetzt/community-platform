import classNames from "classnames";
import { useEffect, useState } from "react";
import { Form } from "react-router";
import { type DashboardLocales } from "~/routes/dashboard.server";
import Search from "./Search";
import { DEFAULT_LANGUAGE } from "~/i18n.shared";

function DashboardSearchPlaceholderRotation(props: {
  locales: DashboardLocales["route"]["content"]["search"]["placeholder"]["rotation"];
}) {
  const [count, setCount] = useState(0);
  const defaultClasses = "text-neutral-700 flex flex-col gap-3 line-clamp-1";

  useEffect(() => {
    const interval = setInterval(
      () => {
        if (count >= props.locales.length + 1) {
          setCount(0);
        } else {
          setCount((prevCount) => prevCount + 1);
        }
      },
      count === 0 ? 2000 : 3000
    );

    return () => {
      clearInterval(interval);
    };
  }, [count, props.locales.length]);

  const [classes, setClasses] = useState(defaultClasses);

  useEffect(() => {
    const newClasses = classNames(
      defaultClasses,
      count === 0 && "mt-0",
      count === 1 && "mt-[-2.25rem]",
      count === 2 && "mt-[-4.5rem]",
      count === 3 && "mt-[-6.75rem]",
      count === 4 && "mt-[-9rem]",
      count === 5 && "mt-[-11.25rem]",
      count <= 5 && count > 0 && "transition-margin duration-1000"
    );
    setClasses(newClasses);

    let timeout = null;
    if (count >= props.locales.length) {
      timeout = setTimeout(() => {
        setClasses(defaultClasses);
        setCount(0);
      }, 1000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [count, defaultClasses, props.locales.length]);

  return (
    <div className={classes}>
      {props.locales.map((item, index) => {
        return <div key={index}>{item}</div>;
      })}
      <div key={props.locales.length}>{props.locales[0]}</div>
    </div>
  );
}

export function DashboardSearch(props: {
  locales: DashboardLocales["route"]["content"]["search"];
}) {
  return (
    <div className="hidden @md:block px-8 mt-12 w-full z-10">
      <div className="w-full flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-[4px_5px_26px_-8px_rgba(177,111,171,0.95)]">
        <h2 className="text-2xl font-bold text-primary-500 mb-0">
          {props.locales.headline}
        </h2>
        <Form method="get" action="/explore/all">
          <Search
            inputProps={{
              id: "search-bar",
              name: "search",
              placeholder:
                typeof props.locales === "undefined"
                  ? DEFAULT_LANGUAGE === "de"
                    ? "Suche..."
                    : "Search..."
                  : props.locales.placeholder.default,
            }}
            locales={props.locales}
          >
            <label className="">
              {typeof props.locales === "undefined" ? (
                DEFAULT_LANGUAGE === "de" ? (
                  "Suche..."
                ) : (
                  "Search..."
                )
              ) : (
                <>
                  <div className="xl:hidden mt-3 text-neutral-700 font-normal">
                    {props.locales.placeholder.default}
                  </div>
                  <div className="hidden xl:flex gap-1 mt-[0.75rem]">
                    <div className="text-neutral-700 font-normal">
                      {props.locales.placeholder.xl}
                    </div>
                    <DashboardSearchPlaceholderRotation
                      locales={props.locales.placeholder.rotation}
                    />
                  </div>
                </>
              )}
            </label>
          </Search>
        </Form>
      </div>
    </div>
  );
}
