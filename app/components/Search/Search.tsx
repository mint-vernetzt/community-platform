import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher, useSearchParams } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import {
  DEFAULT_LANGUAGE,
  type SUPPORTED_COOKIE_LANGUAGES,
} from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { type loader as rootLoader } from "~/root";
import { type RootLocales } from "~/root.server";

type DashboardSearchLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["dashboard"]["route"]["content"]["search"];

type ExploreSearchLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["explore"]["route"]["content"]["search"];

export interface SearchProps {
  query?: string | null;
  locales?:
    | RootLocales["route"]["root"]["search"]
    | DashboardSearchLocales
    | ExploreSearchLocales;
  inputProps: React.HTMLProps<HTMLInputElement>;
  children?: React.ReactNode;
}

function Search(props: SearchProps) {
  const {
    locales,
    children,
    inputProps: { placeholder, minLength = 3, ...otherInputProps },
  } = props;
  const [searchParams] = useSearchParams();
  const query = searchParams.get("search");
  const [value, setValue] = useState(query !== null ? query : "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fetcher = useFetcher<typeof rootLoader>();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setValue(query);

    if (query.length >= minLength) {
      fetcher.submit({ method: "get", search: query });
    }
  };

  const handleClear = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setValue("");
  };

  const handleFocus = () => {
    setIsInputFocused(true);
  };

  const handleBlur = () => {
    setIsInputFocused(false);
  };

  useEffect(() => {
    const handler = (evt: KeyboardEvent) => {
      if ((evt.metaKey || evt.ctrlKey) && evt.key === "k") {
        if (inputRef.current !== null) {
          inputRef.current.focus();
        }
      }
    };
    if (window) {
      window.addEventListener("keydown", handler);
    }
    return () => {
      if (window) {
        window.removeEventListener("keydown", handler);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current !== null &&
        searchRef.current.contains(event.target as Node) === false
      ) {
        setShowResults(false);
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("click", handleClickOutside);
      }
    };
  }, [searchRef, fetcher]);

  useEffect(() => {
    const query = searchParams.get("search");
    setValue(query !== null ? query : "");
  }, [searchParams]);

  useEffect(() => {
    if (isInputFocused === false) {
      return;
    }

    if (
      value.length >= minLength ||
      (value.length >= minLength &&
        typeof fetcher.data !== "undefined" &&
        fetcher.data.tags.length >= minLength)
    ) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [fetcher.data, minLength, value, isInputFocused]);

  const isHydrated = useHydrated();

  return (
    <>
      <div
        className="flex gap-2 h-[48px] items-center overflow-hidden"
        ref={searchRef}
      >
        <div className="relative group w-full">
          <div className="absolute left-1.5 top-1 xl:top-2 w-full flex gap-2 xl:flex-row-reverse xl:justify-between px-1 xl:px-3 py-1 pointer-events-none">
            <div className="mt-0.5 xl:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M13.2747 12.049C14.1219 10.8929 14.5013 9.45956 14.3371 8.0357C14.1729 6.61183 13.4771 5.30246 12.389 4.36957C11.3008 3.43667 9.90056 2.94903 8.46832 3.00422C7.03607 3.05941 5.67748 3.65335 4.66434 4.66721C3.6512 5.68107 3.05824 7.04009 3.00407 8.47238C2.94991 9.90466 3.43855 11.3046 4.37222 12.3921C5.3059 13.4795 6.61576 14.1744 8.03975 14.3376C9.46373 14.5008 10.8968 14.1203 12.0523 13.2722H12.0515C12.0777 13.3072 12.1057 13.3405 12.1372 13.3729L15.5058 16.7415C15.6699 16.9057 15.8925 16.9979 16.1246 16.998C16.3567 16.9981 16.5793 16.906 16.7435 16.7419C16.9076 16.5779 16.9999 16.3553 17 16.1232C17.0001 15.8911 16.908 15.6685 16.7439 15.5043L13.3753 12.1357C13.344 12.104 13.3104 12.0747 13.2747 12.0482V12.049ZM13.5004 8.68567C13.5004 9.31763 13.3759 9.9434 13.1341 10.5273C12.8922 11.1111 12.5378 11.6416 12.0909 12.0885C11.644 12.5354 11.1135 12.8898 10.5297 13.1317C9.94582 13.3735 9.32004 13.498 8.68808 13.498C8.05612 13.498 7.43034 13.3735 6.84648 13.1317C6.26263 12.8898 5.73212 12.5354 5.28526 12.0885C4.83839 11.6416 4.48392 11.1111 4.24208 10.5273C4.00023 9.9434 3.87576 9.31763 3.87576 8.68567C3.87576 7.40936 4.38277 6.18533 5.28526 5.28284C6.18774 4.38036 7.41177 3.87335 8.68808 3.87335C9.96439 3.87335 11.1884 4.38036 12.0909 5.28284C12.9934 6.18533 13.5004 7.40936 13.5004 8.68567Z"
                  className="fill-neutral-700"
                />
              </svg>
            </div>
            <button
              tabIndex={-1}
              className="hidden h-8 xl:group-focus-within:block mt-0.5 xl:mr-0.5 xl:-mt-1 xl:p-1.5 rounded-lg bg-transparent xl:group-focus-within:bg-primary-500 pointer-events-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M13.2747 12.049C14.1219 10.8929 14.5013 9.45956 14.3371 8.0357C14.1729 6.61183 13.4771 5.30246 12.389 4.36957C11.3008 3.43667 9.90056 2.94903 8.46832 3.00422C7.03607 3.05941 5.67748 3.65335 4.66434 4.66721C3.6512 5.68107 3.05824 7.04009 3.00407 8.47238C2.94991 9.90466 3.43855 11.3046 4.37222 12.3921C5.3059 13.4795 6.61576 14.1744 8.03975 14.3376C9.46373 14.5008 10.8968 14.1203 12.0523 13.2722H12.0515C12.0777 13.3072 12.1057 13.3405 12.1372 13.3729L15.5058 16.7415C15.6699 16.9057 15.8925 16.9979 16.1246 16.998C16.3567 16.9981 16.5793 16.906 16.7435 16.7419C16.9076 16.5779 16.9999 16.3553 17 16.1232C17.0001 15.8911 16.908 15.6685 16.7439 15.5043L13.3753 12.1357C13.344 12.104 13.3104 12.0747 13.2747 12.0482V12.049ZM13.5004 8.68567C13.5004 9.31763 13.3759 9.9434 13.1341 10.5273C12.8922 11.1111 12.5378 11.6416 12.0909 12.0885C11.644 12.5354 11.1135 12.8898 10.5297 13.1317C9.94582 13.3735 9.32004 13.498 8.68808 13.498C8.05612 13.498 7.43034 13.3735 6.84648 13.1317C6.26263 12.8898 5.73212 12.5354 5.28526 12.0885C4.83839 11.6416 4.48392 11.1111 4.24208 10.5273C4.00023 9.9434 3.87576 9.31763 3.87576 8.68567C3.87576 7.40936 4.38277 6.18533 5.28526 5.28284C6.18774 4.38036 7.41177 3.87335 8.68808 3.87335C9.96439 3.87335 11.1884 4.38036 12.0909 5.28284C12.9934 6.18533 13.5004 7.40936 13.5004 8.68567Z"
                  className="fill-neutral-600 xl:group-focus-within:fill-white"
                />
              </svg>
            </button>
            {value.length === 0 && (
              <>
                <div className="hidden xl:block xl:group-focus-within:hidden xl:px-2 xl:py-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M13.2747 12.049C14.1219 10.8929 14.5013 9.45956 14.3371 8.0357C14.1729 6.61183 13.4771 5.30246 12.389 4.36957C11.3008 3.43667 9.90056 2.94903 8.46832 3.00422C7.03607 3.05941 5.67748 3.65335 4.66434 4.66721C3.6512 5.68107 3.05824 7.04009 3.00407 8.47238C2.94991 9.90466 3.43855 11.3046 4.37222 12.3921C5.3059 13.4795 6.61576 14.1744 8.03975 14.3376C9.46373 14.5008 10.8968 14.1203 12.0523 13.2722H12.0515C12.0777 13.3072 12.1057 13.3405 12.1372 13.3729L15.5058 16.7415C15.6699 16.9057 15.8925 16.9979 16.1246 16.998C16.3567 16.9981 16.5793 16.906 16.7435 16.7419C16.9076 16.5779 16.9999 16.3553 17 16.1232C17.0001 15.8911 16.908 15.6685 16.7439 15.5043L13.3753 12.1357C13.344 12.104 13.3104 12.0747 13.2747 12.0482V12.049ZM13.5004 8.68567C13.5004 9.31763 13.3759 9.9434 13.1341 10.5273C12.8922 11.1111 12.5378 11.6416 12.0909 12.0885C11.644 12.5354 11.1135 12.8898 10.5297 13.1317C9.94582 13.3735 9.32004 13.498 8.68808 13.498C8.05612 13.498 7.43034 13.3735 6.84648 13.1317C6.26263 12.8898 5.73212 12.5354 5.28526 12.0885C4.83839 11.6416 4.48392 11.1111 4.24208 10.5273C4.00023 9.9434 3.87576 9.31763 3.87576 8.68567C3.87576 7.40936 4.38277 6.18533 5.28526 5.28284C6.18774 4.38036 7.41177 3.87335 8.68808 3.87335C9.96439 3.87335 11.1884 4.38036 12.0909 5.28284C12.9934 6.18533 13.5004 7.40936 13.5004 8.68567Z"
                      className="fill-neutral-700"
                    />
                  </svg>
                </div>
                {isHydrated && (
                  <div className="font-base font-semibold text-neutral-500 -mt-3">
                    {children}
                  </div>
                )}
              </>
            )}
          </div>

          <input
            className="w-full h-10 xl:h-12 outline-hidden bg-neutral-100 xl:bg-neutral-50 min-w-[230px] rounded-lg border border-neutral-100 xl:border-neutral-200 py-2 pl-9 xl:pl-4 pr-4 text-base font-semibold text-neutral-700 appearance-none leading-6 focus:border-primary-200 focus:border-2"
            aria-placeholder={placeholder}
            placeholder={isHydrated === false ? placeholder : undefined}
            minLength={minLength || 3}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            ref={inputRef}
            autoComplete="off"
            aria-label={
              locales !== undefined
                ? locales.label
                : DEFAULT_LANGUAGE === "de"
                  ? "Suchen"
                  : "Search"
            }
            {...otherInputProps}
          />
          {value.length > 0 && (
            <div className="xl:group-focus-within:hidden absolute right-0 xl:right-1 top-0 xl:top-1 text-neutral-700 xl:text-neutral-600">
              <button
                className="px-3 py-4 xl:px-4 bg-transparent"
                type="reset"
                onClick={handleClear}
                aria-label={
                  locales !== undefined
                    ? locales.clear
                    : DEFAULT_LANGUAGE === "de"
                      ? "Suchleiste leeren"
                      : "Clear search field"
                }
                tabIndex={-1}
              >
                <svg
                  viewBox="0 0 10 10"
                  width="10"
                  height="10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M.808.808a.625.625 0 0 1 .885 0L5 4.116 8.308.808a.626.626 0 0 1 .885.885L5.883 5l3.31 3.308a.626.626 0 1 1-.885.885L5 5.883l-3.307 3.31a.626.626 0 1 1-.885-.885L4.116 5 .808 1.693a.625.625 0 0 1 0-.885Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      {showResults && (
        <div className="absolute lg:relative top-[76px] lg:top-2 h-[calc(100dvh-76px)] lg:h-auto w-full left-0 z-30">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs w-full h-full lg:hidden" />
          <ul className="absolute inset-0 h-fit bg-white border-t border-b border-neutral-200 lg:border lg:rounded-lg p-4 text-sm text-neutral-700 flex flex-col gap-4 lg:gap-2">
            <ResultItem title={value} />
            {typeof fetcher.data !== "undefined" &&
              fetcher.data.entities.map((entity, index) => (
                <ResultItem
                  key={`${entity.name}-${entity.type}-${index}`}
                  title={entity.name}
                  entity={entity.type}
                  locales={props.locales}
                  value={value}
                  url={entity.url}
                  logo={entity.logo}
                  blurredLogo={entity.blurredLogo}
                />
              ))}
            {typeof fetcher.data !== "undefined" &&
              fetcher.data.tags
                .slice(0, 7 - fetcher.data.entities.length)
                .map((tag, index) => (
                  <ResultItem
                    key={`${tag.title}-${tag.type}-${index}`}
                    title={tag.title}
                    value={value}
                    entity={tag.type}
                    locales={props.locales}
                  />
                ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ResultItem(props: {
  title: string;
  locales?:
    | RootLocales["route"]["root"]["search"]
    | DashboardSearchLocales
    | ExploreSearchLocales;
  entity?: keyof (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >]["root"]["route"]["root"]["search"]["entities"];
  value?: string;
  url?: string;
  logo?: string | null;
  blurredLogo?: string;
}) {
  let to: string;
  if (
    (props.entity === "profile" ||
      props.entity === "organization" ||
      props.entity === "event" ||
      props.entity === "project" ||
      props.entity === "funding") &&
    typeof props.url !== "undefined"
  ) {
    to = props.url;
  } else if (
    props.entity === "profiles" ||
    props.entity === "organizations" ||
    props.entity === "events" ||
    props.entity === "projects" ||
    props.entity === "fundings"
  ) {
    to = `/explore/${props.entity}?search=${encodeURIComponent(props.title)}`;
  } else {
    to = `/explore/all?search=${encodeURIComponent(props.title)}`;
  }

  // Highlight the search term in the title
  let title = <span className="font-semibold">{props.title}</span>;
  if (typeof props.value !== "undefined") {
    const words = props.value
      .trim()
      .split(/\s+/)
      .filter((value) => {
        return value.length > 0;
      })
      .map((word) => {
        return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      });

    if (words.length > 0) {
      const regex = new RegExp(`(${words.join("|")})`, "gi");
      title = (
        <span className="font-normal">
          {props.title.split(regex).map((part, index) => {
            return (
              <span
                key={index}
                className={part.match(regex) ? "font-semibold" : ""}
              >
                {part}
              </span>
            );
          })}
        </span>
      );
    }
  }

  return (
    <li>
      <Link
        to={to}
        className="w-full h-12 px-2 flex items-center gap-2 text-sm lg:text-base hover:bg-neutral-100 rounded-sm focus:ring-2 focus:ring-primary-200"
        {...(typeof props.url !== "undefined" && props.url.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : { prefetch: "intent" })}
      >
        <div className="w-8 h-8 flex items-center justify-center">
          {props.entity === "profile" ||
          props.entity === "organization" ||
          props.entity === "event" ||
          props.entity === "project" ? (
            <Avatar
              name={props.title}
              logo={props.logo}
              blurredLogo={props.blurredLogo}
              size="full"
            />
          ) : props.entity === "funding" ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.63636 3.5C8.63636 3.22386 8.41251 3 8.13636 3H1.5C0.671572 3 0 3.67157 0 4.5V14.5C0 15.3284 0.671573 16 1.5 16H11.5C12.3284 16 13 15.3284 13 14.5V7.86364C13 7.58749 12.7761 7.36364 12.5 7.36364C12.2239 7.36364 12 7.58749 12 7.86364V14.5C12 14.7761 11.7761 15 11.5 15H1.5C1.22386 15 1 14.7761 1 14.5V4.5C1 4.22386 1.22386 4 1.5 4H8.13636C8.41251 4 8.63636 3.77614 8.63636 3.5Z"
                fill="#4D5970"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16 0.5C16 0.223858 15.7761 0 15.5 0H10.5C10.2239 0 10 0.223858 10 0.5C10 0.776142 10.2239 1 10.5 1H14.2929L6.14645 9.14645C5.95118 9.34171 5.95118 9.65829 6.14645 9.85355C6.34171 10.0488 6.65829 10.0488 6.85355 9.85355L15 1.70711V5.5C15 5.77614 15.2239 6 15.5 6C15.7761 6 16 5.77614 16 5.5V0.5Z"
                fill="#4D5970"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0"
              aria-hidden="true"
            >
              <path
                d="M13.2747 12.049C14.1219 10.8929 14.5013 9.45956 14.3371 8.0357C14.1729 6.61183 13.4771 5.30246 12.389 4.36957C11.3008 3.43667 9.90056 2.94903 8.46832 3.00422C7.03607 3.05941 5.67748 3.65335 4.66434 4.66721C3.6512 5.68107 3.05824 7.04009 3.00407 8.47238C2.94991 9.90466 3.43855 11.3046 4.37222 12.3921C5.3059 13.4795 6.61576 14.1744 8.03975 14.3376C9.46373 14.5008 10.8968 14.1203 12.0523 13.2722H12.0515C12.0777 13.3072 12.1057 13.3405 12.1372 13.3729L15.5058 16.7415C15.6699 16.9057 15.8925 16.9979 16.1246 16.998C16.3567 16.9981 16.5793 16.906 16.7435 16.7419C16.9076 16.5779 16.9999 16.3553 17 16.1232C17.0001 15.8911 16.908 15.6685 16.7439 15.5043L13.3753 12.1357C13.344 12.104 13.3104 12.0747 13.2747 12.0482V12.049ZM13.5004 8.68567C13.5004 9.31763 13.3759 9.9434 13.1341 10.5273C12.8922 11.1111 12.5378 11.6416 12.0909 12.0885C11.644 12.5354 11.1135 12.8898 10.5297 13.1317C9.94582 13.3735 9.32004 13.498 8.68808 13.498C8.05612 13.498 7.43034 13.3735 6.84649 13.1317C6.26263 12.8898 5.73212 12.5354 5.28526 12.0885C4.83839 11.6416 4.48392 11.1111 4.24208 10.5273C4.00023 9.9434 3.87576 9.31763 3.87576 8.68567C3.87576 7.40936 4.38277 6.18533 5.28526 5.28284C6.18774 4.38036 7.41177 3.87335 8.68808 3.87335C9.96439 3.87335 11.1884 4.38036 12.0909 5.28284C12.9934 6.18533 13.5004 7.40936 13.5004 8.68567V8.68567Z"
                fill="#3C4658"
              />
            </svg>
          )}
        </div>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center w-full lg:gap-4">
          <div className="line-clamp-1">{title}</div>
          {typeof props.entity !== "undefined" && (
            <div className="text-neutral-500 font-semibold">
              {typeof props.locales !== "undefined"
                ? props.locales.entities[props.entity]
                : props.entity}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

export default Search;
