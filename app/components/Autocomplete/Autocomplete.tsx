import type { Event, Organization, Profile } from "@prisma/client";
import { useSearchParams, useSubmit } from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import React, { useEffect, useRef, useState } from "react";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getDuration } from "~/lib/utils/time";
import { H3 } from "../Heading/Heading";
import { useTranslation } from "react-i18next";

export interface AutocompleteProps {
  suggestions:
    | Pick<Profile, "firstName" | "lastName" | "id" | "avatar" | "position">[]
    | (Pick<Organization, "name" | "logo" | "id"> & {
        types: {
          organizationType: {
            title: string;
          };
        }[];
      })[]
    | (Pick<
        Event,
        | "id"
        | "name"
        | "slug"
        | "background"
        | "participantLimit"
        | "subline"
        | "description"
      > & {
        stage: {
          title: string;
        } | null;
        _count: {
          childEvents: number;
          participants: number;
          waitingList: number;
        };
        startTime: string;
        endTime: string;
      })[];
  suggestionsLoaderPath: string;
  defaultValue: string;
  searchParameter: string;
  autoFocus?: boolean;
}

const Autocomplete = React.forwardRef(
  (
    props: React.HTMLProps<HTMLInputElement> & AutocompleteProps,
    forwardRef
  ) => {
    const {
      suggestions,
      suggestionsLoaderPath,
      defaultValue,
      searchParameter,
      autoFocus,
      ...rest
    } = props;

    const [searchedValue, setSearchedValue] = useState("");
    const [submitValue, setSubmitValue] = useState("");
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const submit = useSubmit();
    const suggestionsContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchParams] = useSearchParams();
    const suggestionsQuery = searchParams.get(searchParameter);

    useEffect(() => {
      if (inputRef.current !== null) {
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
        const searchParams = {
          [searchParameter]: event.target.value,
        };
        submit(searchParams, {
          method: "get",
          action: suggestionsLoaderPath,
        });
      } else {
        if (suggestionsQuery !== "") {
          const searchParams = {
            [searchParameter]: "",
          };
          submit(searchParams, {
            method: "get",
            action: suggestionsLoaderPath,
          });
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

    const { i18n } = useTranslation();

    return (
      <>
        <input
          ref={inputRef}
          className="input input-bordered w-full input-lg"
          value={searchedValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoFocus={autoFocus !== undefined ? autoFocus : true}
        />
        <input {...rest} hidden value={submitValue} />
        {suggestions.length > 0 ? (
          <div
            className="mt-2 pb-4 md:pb-14"
            id="suggestions-container"
            ref={suggestionsContainerRef}
          >
            {suggestions.map((suggestion, index) => {
              if ("logo" in suggestion) {
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
              } else if ("firstName" in suggestion) {
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
              } else {
                const eventStartTime = utcToZonedTime(
                  suggestion.startTime,
                  "Europe/Berlin"
                );
                const eventEndTime = utcToZonedTime(
                  suggestion.endTime,
                  "Europe/Berlin"
                );
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleClick()}
                    onMouseOver={() => handleMouseOver(index)}
                    className={`${
                      index === activeSuggestion - 1 ? "bg-blue-100 " : ""
                    }w-full text-left border-b border-neutral-400 p-1 flex items-stretch overflow-hidden`}
                  >
                    <div className="hidden xl:block w-40 shrink-0">
                      <img
                        src={
                          suggestion.background ||
                          "/images/default-event-background.jpg"
                        }
                        alt={suggestion.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="px-4 py-6">
                      <p className="text-xs mb-1">
                        {/* TODO: Display icons (see figma) */}
                        {suggestion.stage !== null
                          ? suggestion.stage.title + " | "
                          : ""}
                        {getDuration(
                          eventStartTime,
                          eventEndTime,
                          i18n.language
                        )}
                        {suggestion._count.childEvents === 0 ? (
                          <>
                            {suggestion.participantLimit === null
                              ? " | Unbegrenzte Plätze"
                              : ` | ${
                                  suggestion.participantLimit -
                                  suggestion._count.participants
                                } / ${
                                  suggestion.participantLimit
                                } Plätzen frei`}
                          </>
                        ) : (
                          ""
                        )}
                        {suggestion.participantLimit !== null &&
                        suggestion._count.participants >=
                          suggestion.participantLimit ? (
                          <>
                            {" "}
                            |{" "}
                            <span>
                              {suggestion._count.waitingList} auf der Warteliste
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </p>
                      <h4 className="font-bold text-base m-0 md:line-clamp-1">
                        {suggestion.name}
                      </h4>
                      {suggestion.subline !== null ? (
                        <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                          {suggestion.subline}
                        </p>
                      ) : (
                        <p className="hidden md:block text-xs mt-1 md:line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}
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
