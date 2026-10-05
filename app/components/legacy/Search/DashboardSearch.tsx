import classNames from "classnames";
import { useEffect, useState } from "react";
import { Form } from "react-router";
import { type DashboardLocales } from "~/routes/dashboard.server";
import Search from "./Search";

function DashboardSearchPlaceholderRotation(props: {
  locales: DashboardLocales["route"]["content"]["search"]["placeholder"]["rotation"];
}) {
  const [count, setCount] = useState(0);
  const defaultClasses = "text-neutral-700 flex flex-col gap-3 line-clamp-1";
  const [classes, setClasses] = useState(defaultClasses);

  useEffect(() => {
    const interval = setInterval(
      () => {
        const newClasses = classNames(
          defaultClasses,
          count === 0 && "mt-0",
          count === 1 && "-mt-9",
          count === 2 && "-mt-18",
          count === 3 && "-mt-27",
          count === 4 && "-mt-36",
          count === 5 && "-mt-45",
          count <= 5 && count > 0 && "transition-margin duration-1000"
        );
        setClasses(newClasses);
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
              placeholder: props.locales.placeholder.defaultValue,
            }}
            locales={props.locales}
          >
            <label className="">
              <div className="xl:hidden mt-3 text-neutral-700 font-normal">
                {props.locales.placeholder.defaultValue}
              </div>
              <div className="hidden xl:flex gap-1 mt-3">
                <div className="text-neutral-700 font-normal">
                  {props.locales.placeholder.xl}
                </div>
                <DashboardSearchPlaceholderRotation
                  locales={props.locales.placeholder.rotation}
                />
              </div>
            </label>
          </Search>
        </Form>
      </div>
    </div>
  );
}
