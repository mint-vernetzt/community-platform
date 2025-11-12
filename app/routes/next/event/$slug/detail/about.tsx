import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { ChipContainer } from "~/components/next/ChipContainer";
import ChipMedium from "~/components/next/ChipMedium";
import EventSubline from "~/components/next/EventSubline";
import EventTypeBadge from "~/components/next/EventTypeBadge";
import HeadlineAndTagsContainer from "~/components/next/HeadlineAndTagsContainer";
import HeadlineChipsAndTags from "~/components/next/HeadlineChipsAndTags";
import LabelAndChipsContainer from "~/components/next/LabelAndChipsContainer";
import LongTextContainer from "~/components/next/LongTextContainer";
import Tags from "~/components/next/Tags";
import { detectLanguage } from "~/i18n.server";
import { getLocaleFromSlug } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import {
  getEventBySlug,
  getFullDepthSpeakerIds,
  getSpeakersOfEvent,
} from "./about.server";
import {
  getFormattedAddress,
  hasAddress,
  hasDescription,
  hasDescriptionSection,
  hasEventTargetGroups,
  hasExperienceLevel,
  hasFocuses,
  hasGeneralInfo,
  hasSpeakers,
  hasSubline,
  hasSublineAndTypesSection,
  hasTags,
  hasTypes,
  SEARCH_SPEAKERS_SEARCH_PARAM,
} from "./about.shared";
import HeadlineContainer from "~/components/next/HeadlineContainer";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import { useState } from "react";
import { getChildEventCount } from "../utils.server";
import { createAuthClient, getSessionUser } from "~/auth.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/$slug/detail/about"];

  invariantResponse(typeof params.slug !== "undefined", "slug not found", {
    status: 400,
  });

  const childEventCount = await getChildEventCount(params.slug);
  let optionalSpeakerWhereClause;
  if (childEventCount > 0) {
    const speakerIds = await getFullDepthSpeakerIds(params.slug);
    optionalSpeakerWhereClause = {
      id: {
        in: speakerIds,
      },
    };
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const { submission, speakers } = await getSpeakersOfEvent({
    slug: params.slug,
    authClient,
    sessionUser,
    searchParams,
    optionalWhereClause: optionalSpeakerWhereClause,
  });

  const event = await getEventBySlug(params.slug);

  invariantResponse(event, locales.route.error.eventNotFound, { status: 404 });

  return {
    locales,
    event: {
      ...event,
      speakers,
    },
    submission,
  };
}

function About() {
  const { event, locales, submission } = useLoaderData<typeof loader>();

  const [speakers, setSpeakers] = useState(event.speakers);

  return (
    <div className="w-full flex flex-col gap-8 md:gap-10">
      {hasDescriptionSection(event) ? (
        <div className="w-full flex flex-col gap-4">
          {hasSublineAndTypesSection(event) ? (
            <div className="w-full flex flex-col gap-2">
              {hasTypes(event) ? (
                <EventTypeBadge>
                  {event.types
                    .map((relation) => {
                      return getLocaleFromSlug(
                        relation.eventType.slug,
                        locales.eventTypes
                      );
                    })
                    .join(" / ")}
                </EventTypeBadge>
              ) : null}
              {hasSubline(event) ? (
                <EventSubline>{event.subline}</EventSubline>
              ) : null}
            </div>
          ) : null}
          {hasDescription(event) ? (
            <LongTextContainer as="div">
              <RichText html={event.description} />
            </LongTextContainer>
          ) : null}
        </div>
      ) : null}
      {hasGeneralInfo(event) ? (
        <div className="w-full flex flex-col gap-6">
          {hasAddress(event) ? (
            <HeadlineAndTagsContainer>
              <HeadlineChipsAndTags as="h3">
                {locales.route.venue.label}
              </HeadlineChipsAndTags>
              <Tags as="address">{getFormattedAddress(event)}</Tags>
            </HeadlineAndTagsContainer>
          ) : null}
          {hasEventTargetGroups(event) ? (
            <LabelAndChipsContainer>
              <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
                {locales.route.eventTargetGroups.label}
              </h3>
              <ChipContainer>
                {event.eventTargetGroups.map((relation) => {
                  return (
                    <ChipMedium key={relation.eventTargetGroup.slug}>
                      {getLocaleFromSlug(
                        relation.eventTargetGroup.slug,
                        locales.eventTargetGroups
                      )}
                    </ChipMedium>
                  );
                })}
              </ChipContainer>
            </LabelAndChipsContainer>
          ) : null}
          {hasFocuses(event) ? (
            <LabelAndChipsContainer>
              <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
                {locales.route.focuses.label}
              </h3>
              <ChipContainer>
                {event.focuses.map((relation) => {
                  return (
                    <ChipMedium key={relation.focus.slug}>
                      {getLocaleFromSlug(relation.focus.slug, locales.focuses)}
                    </ChipMedium>
                  );
                })}
              </ChipContainer>
            </LabelAndChipsContainer>
          ) : null}
          {hasExperienceLevel(event) ? (
            <LabelAndChipsContainer>
              <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
                {locales.route.experienceLevel.label}
              </h3>
              <ChipContainer>
                <ChipMedium>
                  {getLocaleFromSlug(
                    event.experienceLevel.slug,
                    locales.experienceLevels
                  )}
                </ChipMedium>
              </ChipContainer>
            </LabelAndChipsContainer>
          ) : null}
          {hasTags(event) ? (
            <LabelAndChipsContainer>
              <h3 className="mb-0 text-neutral-600 text-xs font-semibold leading-4">
                {locales.route.tags.label}
              </h3>
              <ChipContainer>
                {event.tags.map((relation) => {
                  return (
                    <ChipMedium key={relation.tag.slug}>
                      {getLocaleFromSlug(relation.tag.slug, locales.tags)}
                    </ChipMedium>
                  );
                })}
              </ChipContainer>
            </LabelAndChipsContainer>
          ) : null}
        </div>
      ) : null}
      {hasSpeakers(event) ? (
        <div className="w-full flex flex-col gap-4">
          <HeadlineContainer as="h3">
            {locales.route.speakers.headline}
          </HeadlineContainer>
          <List id="speakers-list" hideAfter={4} locales={locales.route.list}>
            <List.Search
              defaultItems={event.speakers}
              setValues={setSpeakers}
              searchParam={SEARCH_SPEAKERS_SEARCH_PARAM}
              locales={{
                placeholder: locales.route.speakers.searchPlaceholder,
              }}
              hideUntil={4}
              label={locales.route.speakers.searchPlaceholder}
              submission={submission}
            />
            {speakers.map((speaker, index) => {
              return (
                <ListItemPersonOrg
                  key={speaker.id}
                  index={index}
                  to={`/profile/${speaker.username}`}
                >
                  <ListItemPersonOrg.Avatar size="full" {...speaker} />
                  <ListItemPersonOrg.Headline>
                    {speaker.academicTitle !== null &&
                    speaker.academicTitle.length > 0
                      ? `${speaker.academicTitle} `
                      : ""}
                    {speaker.firstName} {speaker.lastName}
                  </ListItemPersonOrg.Headline>
                  {speaker.position !== null ? (
                    <ListItemPersonOrg.Subline>
                      {speaker.position}
                    </ListItemPersonOrg.Subline>
                  ) : null}
                </ListItemPersonOrg>
              );
            })}
          </List>
        </div>
      ) : null}
    </div>
  );
}

export default About;
