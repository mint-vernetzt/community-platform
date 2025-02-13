import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import type { Event, Organization, Profile } from "@prisma/client";
import { useSearchParams, useSubmit } from "react-router";
import { utcToZonedTime } from "date-fns-tz";
import React, { useEffect, useRef, useState } from "react";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { getInitials } from "~/lib/profile/getInitials";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getDuration } from "~/lib/utils/time";
import { type ArrayElement } from "~/lib/utils/types";
import { H3 } from "../Heading/Heading";
import { type EventWaitingListSettingsLocales } from "~/routes/event/$slug/settings/waiting-list.server";
import { type EventTeamSettingsLocales } from "~/routes/event/$slug/settings/team.server";
import { type EventAdminsSettingsLocales } from "~/routes/event/$slug/settings/admins.server";
import { type ConnectedEventsSettingsLocales } from "~/routes/event/$slug/settings/events.server";
import { type EventOrganizationsSettingsLocales } from "~/routes/event/$slug/settings/organizations.server";
import { type EventParticipantsLocales } from "~/routes/event/$slug/settings/participants.server";
import { type EventSpeakersSettingsLocales } from "~/routes/event/$slug/settings/speakers.server";

export interface AutocompleteProps {
  suggestions:
    | Array<
        Pick<
          Profile,
          "firstName" | "lastName" | "id" | "avatar" | "position"
        > & { blurredAvatar?: string }
      >
    | (Pick<Organization, "name" | "logo" | "id"> & {
        types: {
          organizationType: {
            slug: string;
          };
        }[];
        blurredLogo?: string;
      })[]
    | (Pick<
        Event,
        "id" | "name" | "slug" | "participantLimit" | "subline" | "description"
      > & {
        stage: {
          slug: string;
        } | null;
        _count: {
          childEvents: number;
          participants: number;
          waitingList: number;
        };
        startTime: Date;
        endTime: Date;
        background: string;
        blurredBackground?: string;
      })[];
  suggestionsLoaderPath: string;
  defaultValue: string;
  searchParameter: string;
  locales?:
    | EventWaitingListSettingsLocales
    | EventTeamSettingsLocales
    | EventAdminsSettingsLocales
    | ConnectedEventsSettingsLocales
    | EventOrganizationsSettingsLocales
    | EventParticipantsLocales
    | EventSpeakersSettingsLocales;
  currentLanguage: ArrayElement<typeof supportedCookieLanguages>;
}

function Autocomplete(
  props: React.HTMLProps<HTMLInputElement> & AutocompleteProps
) {
  const {
    suggestions,
    suggestionsLoaderPath,
    defaultValue,
    searchParameter,
    locales,
    currentLanguage,
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
  }, [defaultValue]);

  useEffect(() => {
    if (
      suggestionsContainerRef.current !== null &&
      suggestionsContainerRef.current.getBoundingClientRect().bottom >
        window.innerHeight
    ) {
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
        preventScrollReset: true,
      });
    } else {
      if (suggestionsQuery !== "") {
        const searchParams = {
          [searchParameter]: "",
        };
        submit(searchParams, {
          method: "get",
          action: suggestionsLoaderPath,
          preventScrollReset: true,
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
    }
  };

  const handleMouseOver = (index: number): void => {
    setActiveSuggestion(index + 1);
  };

  const handleClick = () => {
    if (typeof suggestions[activeSuggestion - 1] !== "undefined") {
      setSubmitValue(suggestions[activeSuggestion - 1].id);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        className="input input-bordered w-full input-lg"
        value={searchedValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <input {...rest} hidden value={submitValue} />
      {suggestions.length > 0 ? (
        <div
          className="mt-2 pb-4 @md:mv-pb-14"
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
                  onFocus={() => handleMouseOver(index)}
                >
                  <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                    {suggestion.logo !== null && suggestion.logo !== "" ? (
                      <Avatar
                        size="full"
                        name={suggestion.name}
                        logo={suggestion.logo}
                        blurredLogo={suggestion.blurredLogo}
                      />
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
                            let title;
                            if (locales === undefined) {
                              return item.organizationType.slug;
                            }
                            if (
                              item.organizationType.slug in
                              locales.organizationTypes
                            ) {
                              type LocaleKey =
                                keyof typeof locales.organizationTypes;
                              title =
                                locales.organizationTypes[
                                  item.organizationType.slug as LocaleKey
                                ].title;
                            } else {
                              console.error(
                                `Organization type ${item.organizationType.slug} not found in locales`
                              );
                              title = item.organizationType.slug;
                            }
                            return title;
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
                  onFocus={() => handleMouseOver(index)}
                >
                  <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full border overflow-hidden shrink-0">
                    {suggestion.avatar !== null && suggestion.avatar !== "" ? (
                      <Avatar
                        size="full"
                        firstName={suggestion.firstName}
                        lastName={suggestion.lastName}
                        avatar={suggestion.avatar}
                        blurredAvatar={suggestion.blurredAvatar}
                      />
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
                  onFocus={() => handleMouseOver(index)}
                  className={`${
                    index === activeSuggestion - 1 ? "bg-blue-100 " : ""
                  }w-full text-left border-b border-neutral-400 p-1 flex items-stretch overflow-hidden`}
                >
                  <div className="hidden @xl:mv-block w-40 shrink-0">
                    <Image
                      alt={suggestion.name}
                      src={suggestion.background}
                      blurredSrc={suggestion.blurredBackground}
                    />
                  </div>
                  <div className="px-4 py-6">
                    <p className="text-xs mb-1">
                      {/* TODO: Display icons (see figma) */}
                      {suggestion.stage !== null
                        ? (() => {
                            let title;
                            if (locales === undefined) {
                              return suggestion.stage.slug;
                            }
                            if (suggestion.stage.slug in locales.stages) {
                              type LocaleKey = keyof typeof locales.stages;
                              title =
                                locales.stages[
                                  suggestion.stage.slug as LocaleKey
                                ].title;
                            } else {
                              console.error(
                                `Event stage ${suggestion.stage.slug} not found in locales`
                              );
                              title = suggestion.stage.slug;
                            }
                            return title;
                          })() + " | "
                        : ""}
                      {getDuration(
                        eventStartTime,
                        eventEndTime,
                        currentLanguage
                      )}
                      {suggestion._count.childEvents === 0 ? (
                        <>
                          {suggestion.participantLimit === null
                            ? " | Unbegrenzte Plätze"
                            : ` | ${
                                suggestion.participantLimit -
                                suggestion._count.participants
                              } / ${suggestion.participantLimit} Plätzen frei`}
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
                    <h4 className="font-bold text-base m-0 @md:mv-line-clamp-1">
                      {suggestion.name}
                    </h4>
                    {suggestion.subline !== null ? (
                      <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-2">
                        {suggestion.subline}
                      </p>
                    ) : (
                      <p className="mv-hidden text-xs mt-1 @md:mv-line-clamp-2">
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

export default Autocomplete;
