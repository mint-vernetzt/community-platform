import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
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
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { filterEventByVisibility } from "~/next-public-fields-filtering.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { getEventBySlug } from "./about.server";
import {
  getFormattedAddress,
  hasAddress,
  hasDescription,
  hasDescriptionSection,
  hasEventTargetGroups,
  hasExperienceLevel,
  hasFocuses,
  hasGeneralInfo,
  hasSubline,
  hasSublineAndTypesSection,
  hasTags,
  hasTypes,
} from "./about.shared";
import { getLocaleFromSlug } from "~/i18n.shared";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/$slug/detail/about"];

  invariantResponse(typeof params.slug !== "undefined", "slug not found", {
    status: 400,
  });

  const event = await getEventBySlug(params.slug);

  invariantResponse(event, locales.route.error.eventNotFound, { status: 404 });

  const mode = await deriveEventMode(sessionUser, params.slug);

  let filteredEvent;
  if (mode === "anon") {
    filteredEvent = filterEventByVisibility<typeof event>(event);
  } else {
    filteredEvent = event;
  }

  return {
    locales,
    event: filteredEvent,
  };
}

function About() {
  const { event, locales } = useLoaderData<typeof loader>();

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
                <EventSubline>
                  <RichText html={event.subline} />
                </EventSubline>
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
    </div>
  );
}

export default About;
