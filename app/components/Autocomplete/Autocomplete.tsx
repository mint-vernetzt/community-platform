import type { Organization, Profile } from "@prisma/client";
import { useSearchParams, useSubmit } from "@remix-run/react";
import React, { useEffect, useRef, useState } from "react";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { H3 } from "../Heading/Heading";

export interface AutocompleteProps {
  suggestions:
    | Pick<Profile, "firstName" | "lastName" | "id" | "avatar" | "position">[]
    | (Pick<Organization, "name" | "logo" | "id"> & {
        types: {
          organizationType: {
            title: string;
          };
        }[];
      })[];
  suggestionsLoaderPath: string;
  defaultValue: string;
}

const Autocomplete = React.forwardRef(
  (
    props: React.HTMLProps<HTMLInputElement> & AutocompleteProps,
    forwardRef
  ) => {
    const { suggestions, suggestionsLoaderPath, defaultValue, ...rest } = props;

    const [searchedValue, setSearchedValue] = useState("");
    const [submitValue, setSubmitValue] = useState("");
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const submit = useSubmit();
    const suggestionsContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchParams] = useSearchParams();
    const suggestionsQuery = searchParams.get("autocomplete_query");

    useEffect(() => {
      if (inputRef.current !== null) {
        inputRef.current.focus();
        setSearchedValue(defaultValue);
      }
    }, []);

    useEffect(() => {
      if (suggestionsContainerRef.current !== null) {
        suggestionsContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, [suggestions.length]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchedValue(event.target.value);
      if (event.target.value.length >= 3) {
        submit(
          {
            autocomplete_query: event.target.value,
          },
          {
            method: "get",
            action: suggestionsLoaderPath,
          }
        );
      } else {
        if (suggestionsQuery !== "") {
          submit(
            {
              autocomplete_query: "",
            },
            {
              method: "get",
              action: suggestionsLoaderPath,
            }
          );
        }
      }
    };

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ): void => {
      if (event.key === "ArrowDown" && activeSuggestion < suggestions.length) {
        event.preventDefault();
        event.stopPropagation();
        setActiveSuggestion(activeSuggestion + 1);
      } else if (event.key === "ArrowUp" && activeSuggestion > 1) {
        event.preventDefault();
        event.stopPropagation();
        setActiveSuggestion(activeSuggestion - 1);
      } else if (event.key === "Enter") {
        setSubmitValue(suggestions[activeSuggestion - 1].id);
        setActiveSuggestion(0);
      }
    };

    const handleMouseOver = (index: number): void => {
      setActiveSuggestion(index + 1);
    };

    const handleClick = () => {
      setSubmitValue(suggestions[activeSuggestion - 1].id);
      setActiveSuggestion(0);
    };

    return (
      <>
        <input
          ref={inputRef}
          className="input input-bordered w-full mt-1"
          value={searchedValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <input {...rest} hidden value={submitValue} />
        {suggestions.length > 0 ? (
          <div
            className="mt-2 pb-4 md:pb-14"
            id="suggestions-container"
            ref={suggestionsContainerRef}
          >
            {suggestions.map((suggestion, index) => {
              if ("name" in suggestion) {
                const initials = getInitialsOfName(suggestion.name);
                return (
                  <button
                    key={suggestion.id}
                    className={`${
                      index === activeSuggestion - 1 ? "bg-blue-100 " : ""
                    }w-full flex items-center flex-row border-b border-neutral-400 p-4 cursor-pointer rounded-lg`}
                    onClick={() => handleClick()}
                    onMouseOver={() => handleMouseOver(index)}
                  >
                    <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                      {suggestion.logo !== null && suggestion.logo !== "" ? (
                        <img src={suggestion.logo} alt={suggestion.name} />
                      ) : (
                        <>{initials}</>
                      )}
                    </div>
                    <div className="pl-4">
                      <H3 like="h4" className="text-xl mb-1 text-left">
                        {suggestion.name}
                      </H3>
                      {suggestion.types.length !== 0 ? (
                        <p className="font-bold text-sm text-left">
                          {suggestion.types
                            .map((item) => {
                              return item.organizationType.title;
                            })
                            .join(" / ")}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              } else {
                const initials = getInitials(suggestion);
                return (
                  <button
                    key={suggestion.id}
                    className={`${
                      index === activeSuggestion - 1 ? "bg-blue-100 " : ""
                    }w-full flex items-center flex-row border-b border-neutral-400 p-4`}
                    onClick={() => handleClick()}
                    onMouseOver={() => handleMouseOver(index)}
                  >
                    <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                      {suggestion.avatar !== null &&
                      suggestion.avatar !== "" ? (
                        <img src={suggestion.avatar} alt={initials} />
                      ) : (
                        <>{initials}</>
                      )}
                    </div>
                    <div className="pl-4">
                      <H3 like="h4" className="text-xl mb-1 text-left">
                        {suggestion.firstName} {suggestion.lastName}
                      </H3>
                      {suggestion.position ? (
                        <p className="font-bold text-sm cursor-default text-left">
                          {suggestion.position}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              }
            })}
          </div>
        ) : null}
      </>
    );
  }
);

export default Autocomplete;
Autocomplete.displayName = "Autocomplete";
