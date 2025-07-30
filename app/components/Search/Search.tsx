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

export interface SearchProps {
  query?: string | null;
  locales?: RootLocales["route"]["root"]["search"] | DashboardSearchLocales;
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

    if (query.length > minLength) {
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
    // TODO: fix any type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (evt: any) => {
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
      value.length > minLength ||
      (value.length > minLength &&
        typeof fetcher.data !== "undefined" &&
        fetcher.data.tags.length > minLength)
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
        className="mv-flex mv-gap-2 mv-h-[48px] mv-items-center mv-overflow-hidden"
        ref={searchRef}
      >
        <div className="mv-relative mv-group mv-w-full">
          <div className="mv-absolute mv-left-1.5 mv-top-1 xl:mv-top-2 mv-w-full mv-flex mv-gap-2 xl:mv-flex-row-reverse xl:mv-justify-between mv-px-1 xl:mv-px-3 mv-py-1 mv-pointer-events-none">
            <div className="mv-mt-0.5 xl:mv-hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M13.2747 12.049C14.1219 10.8929 14.5013 9.45956 14.3371 8.0357C14.1729 6.61183 13.4771 5.30246 12.389 4.36957C11.3008 3.43667 9.90056 2.94903 8.46832 3.00422C7.03607 3.05941 5.67748 3.65335 4.66434 4.66721C3.6512 5.68107 3.05824 7.04009 3.00407 8.47238C2.94991 9.90466 3.43855 11.3046 4.37222 12.3921C5.3059 13.4795 6.61576 14.1744 8.03975 14.3376C9.46373 14.5008 10.8968 14.1203 12.0523 13.2722H12.0515C12.0777 13.3072 12.1057 13.3405 12.1372 13.3729L15.5058 16.7415C15.6699 16.9057 15.8925 16.9979 16.1246 16.998C16.3567 16.9981 16.5793 16.906 16.7435 16.7419C16.9076 16.5779 16.9999 16.3553 17 16.1232C17.0001 15.8911 16.908 15.6685 16.7439 15.5043L13.3753 12.1357C13.344 12.104 13.3104 12.0747 13.2747 12.0482V12.049ZM13.5004 8.68567C13.5004 9.31763 13.3759 9.9434 13.1341 10.5273C12.8922 11.1111 12.5378 11.6416 12.0909 12.0885C11.644 12.5354 11.1135 12.8898 10.5297 13.1317C9.94582 13.3735 9.32004 13.498 8.68808 13.498C8.05612 13.498 7.43034 13.3735 6.84648 13.1317C6.26263 12.8898 5.73212 12.5354 5.28526 12.0885C4.83839 11.6416 4.48392 11.1111 4.24208 10.5273C4.00023 9.9434 3.87576 9.31763 3.87576 8.68567C3.87576 7.40936 4.38277 6.18533 5.28526 5.28284C6.18774 4.38036 7.41177 3.87335 8.68808 3.87335C9.96439 3.87335 11.1884 4.38036 12.0909 5.28284C12.9934 6.18533 13.5004 7.40936 13.5004 8.68567Z"
                  className="mv-fill-neutral-700"
                />
              </svg>
            </div>
            <button
              tabIndex={-1}
              className="mv-hidden mv-h-8 xl:group-focus-within:mv-block mv-mt-0.5 xl:mv-mr-0.5 xl:mv--mt-1 xl:mv-p-1.5 mv-rounded-lg mv-bg-transparent xl:group-focus-within:mv-bg-primary-500 mv-pointer-events-auto"
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
                  className="mv-fill-neutral-600 xl:group-focus-within:mv-fill-white"
                />
              </svg>
            </button>
            {value.length === 0 && (
              <>
                <div className="mv-hidden xl:mv-block xl:group-focus-within:mv-hidden xl:mv-px-2 xl:mv-py-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M13.2747 12.049C14.1219 10.8929 14.5013 9.45956 14.3371 8.0357C14.1729 6.61183 13.4771 5.30246 12.389 4.36957C11.3008 3.43667 9.90056 2.94903 8.46832 3.00422C7.03607 3.05941 5.67748 3.65335 4.66434 4.66721C3.6512 5.68107 3.05824 7.04009 3.00407 8.47238C2.94991 9.90466 3.43855 11.3046 4.37222 12.3921C5.3059 13.4795 6.61576 14.1744 8.03975 14.3376C9.46373 14.5008 10.8968 14.1203 12.0523 13.2722H12.0515C12.0777 13.3072 12.1057 13.3405 12.1372 13.3729L15.5058 16.7415C15.6699 16.9057 15.8925 16.9979 16.1246 16.998C16.3567 16.9981 16.5793 16.906 16.7435 16.7419C16.9076 16.5779 16.9999 16.3553 17 16.1232C17.0001 15.8911 16.908 15.6685 16.7439 15.5043L13.3753 12.1357C13.344 12.104 13.3104 12.0747 13.2747 12.0482V12.049ZM13.5004 8.68567C13.5004 9.31763 13.3759 9.9434 13.1341 10.5273C12.8922 11.1111 12.5378 11.6416 12.0909 12.0885C11.644 12.5354 11.1135 12.8898 10.5297 13.1317C9.94582 13.3735 9.32004 13.498 8.68808 13.498C8.05612 13.498 7.43034 13.3735 6.84648 13.1317C6.26263 12.8898 5.73212 12.5354 5.28526 12.0885C4.83839 11.6416 4.48392 11.1111 4.24208 10.5273C4.00023 9.9434 3.87576 9.31763 3.87576 8.68567C3.87576 7.40936 4.38277 6.18533 5.28526 5.28284C6.18774 4.38036 7.41177 3.87335 8.68808 3.87335C9.96439 3.87335 11.1884 4.38036 12.0909 5.28284C12.9934 6.18533 13.5004 7.40936 13.5004 8.68567Z"
                      className="mv-fill-neutral-700"
                    />
                  </svg>
                </div>
                {isHydrated && (
                  <div className="mv-font-base mv-font-semibold mv-text-neutral-500 mv--mt-3">
                    {children}
                  </div>
                )}
              </>
            )}
          </div>

          <input
            className="mv-w-full mv-h-10 xl:mv-h-12 mv-outline-none mv-bg-neutral-100 xl:mv-bg-neutral-50 mv-min-w-[230px] mv-rounded-lg mv-border mv-border-neutral-100 xl:mv-border-neutral-200 mv-py-2 mv-pl-9 xl:mv-pl-4 mv-pr-4 mv-text-base mv-font-semibold mv-text-neutral-700 mv-appearance-none mv-leading-6 focus:mv-border-primary-200 focus:mv-border-2"
            aria-placeholder={placeholder}
            placeholder={isHydrated === false ? placeholder : undefined}
            minLength={minLength || 3}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            ref={inputRef}
            autoComplete="off"
            {...otherInputProps}
          />
          {value.length > 0 && (
            <div className="xl:group-focus-within:mv-hidden mv-absolute mv-right-0 xl:mv-right-1 mv-top-0 xl:mv-top-1 mv-text-neutral-700 xl:mv-text-neutral-600">
              <button
                className="mv-px-3 mv-py-4 xl:mv-px-4 mv-bg-transparent"
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
        <div className="mv-absolute lg:mv-relative mv-top-[76px] lg:mv-top-2 mv-h-[calc(100dvh-76px)] lg:mv-h-auto mv-w-full mv-left-0 mv-z-20">
          <div className="mv-absolute mv-inset-0 mv-bg-black mv-bg-opacity-50 mv-backdrop-blur-sm mv-w-full mv-h-full lg:mv-hidden" />
          <ul className="mv-absolute mv-inset-0 mv-h-fit mv-bg-white mv-border-t mv-border-b mv-border-neutral-200 lg:mv-border lg:mv-rounded-lg mv-p-4 mv-text-sm mv-text-neutral-700 mv-flex mv-flex-col mv-gap-4">
            <ResultItem title={value} />
            {typeof fetcher.data !== "undefined" &&
              fetcher.data.tags.map((tag, index) => (
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
  locales?: RootLocales["route"]["root"]["search"] | DashboardSearchLocales;
  entity?: keyof (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >]["root"]["route"]["root"]["search"]["entities"];
  value?: string;
}) {
  let to: string;
  if (
    props.entity === "profile" ||
    props.entity === "organization" ||
    props.entity === "event" ||
    props.entity === "project" ||
    props.entity === "funding"
  ) {
    to = `/explore/${props.entity}s?search=${props.title}`;
  } else {
    to = `/explore/all?search=${props.title}`;
  }

  // Highlight the search term in the title
  let title = <span className="mv-font-semibold">{props.title}</span>;
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
        <span className="mv-font-normal">
          {props.title.split(regex).map((part, index) => {
            return (
              <span
                key={index}
                className={part.match(regex) ? "mv-font-semibold" : ""}
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
        className="mv-inline-block mv-w-full mv-h-12 mv-px-2 mv-flex mv-items-center mv-gap-2 mv-text-sm lg:mv-text-base hover:mv-bg-neutral-100 mv-rounded focus:mv-ring-2 focus:mv-ring-primary-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="mv-flex-shrink-0"
        >
          <path
            d="M13.2747 12.049C14.1219 10.8929 14.5013 9.45956 14.3371 8.0357C14.1729 6.61183 13.4771 5.30246 12.389 4.36957C11.3008 3.43667 9.90056 2.94903 8.46832 3.00422C7.03607 3.05941 5.67748 3.65335 4.66434 4.66721C3.6512 5.68107 3.05824 7.04009 3.00407 8.47238C2.94991 9.90466 3.43855 11.3046 4.37222 12.3921C5.3059 13.4795 6.61576 14.1744 8.03975 14.3376C9.46373 14.5008 10.8968 14.1203 12.0523 13.2722H12.0515C12.0777 13.3072 12.1057 13.3405 12.1372 13.3729L15.5058 16.7415C15.6699 16.9057 15.8925 16.9979 16.1246 16.998C16.3567 16.9981 16.5793 16.906 16.7435 16.7419C16.9076 16.5779 16.9999 16.3553 17 16.1232C17.0001 15.8911 16.908 15.6685 16.7439 15.5043L13.3753 12.1357C13.344 12.104 13.3104 12.0747 13.2747 12.0482V12.049ZM13.5004 8.68567C13.5004 9.31763 13.3759 9.9434 13.1341 10.5273C12.8922 11.1111 12.5378 11.6416 12.0909 12.0885C11.644 12.5354 11.1135 12.8898 10.5297 13.1317C9.94582 13.3735 9.32004 13.498 8.68808 13.498C8.05612 13.498 7.43034 13.3735 6.84649 13.1317C6.26263 12.8898 5.73212 12.5354 5.28526 12.0885C4.83839 11.6416 4.48392 11.1111 4.24208 10.5273C4.00023 9.9434 3.87576 9.31763 3.87576 8.68567C3.87576 7.40936 4.38277 6.18533 5.28526 5.28284C6.18774 4.38036 7.41177 3.87335 8.68808 3.87335C9.96439 3.87335 11.1884 4.38036 12.0909 5.28284C12.9934 6.18533 13.5004 7.40936 13.5004 8.68567V8.68567Z"
            fill="#3C4658"
          />
        </svg>
        <div className="mv-flex mv-flex-col lg:mv-flex-row lg:mv-justify-between lg:mv-items-center mv-w-full">
          <div className="mv-line-clamp-1">{title}</div>
          {typeof props.entity !== "undefined" && (
            <div className="mv-text-neutral-500 mv-font-semibold">
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
