import { useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { ChipContainer } from "~/components/next/ChipContainer";
import ChipMedium from "~/components/next/ChipMedium";
import EventSubline from "~/components/next/EventSubline";
import EventTypeBadge from "~/components/next/EventTypeBadge";
import HeadlineAndTagsContainer from "~/components/next/HeadlineAndTagsContainer";
import HeadlineChipsAndTags from "~/components/next/HeadlineChipsAndTags";
import HeadlineContainer from "~/components/next/HeadlineContainer";
import LabelAndChipsContainer from "~/components/next/LabelAndChipsContainer";
import List from "~/components/next/List";
import ListItemPersonOrg from "~/components/next/ListItemPersonOrg";
import LongTextContainer from "~/components/next/LongTextContainer";
import Tags from "~/components/next/Tags";
import { detectLanguage } from "~/i18n.server";
import { getLocaleFromSlug } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getChildEventCount } from "../utils.server";
import {
  getEventBySlug,
  getFullDepthSpeakerIds,
  getSpeakersOfEvent,
} from "./about.server";
import {
  getFormattedAddress,
  getSearchResponsibleOrganizationsSchema,
  getSearchSpeakersSchema,
  getSearchTeamMembersSchema,
  hasAddress,
  hasDescription,
  hasDescriptionSection,
  hasEventTargetGroups,
  hasExperienceLevel,
  hasFocuses,
  hasGeneralInfo,
  hasResponsibleOrganizations,
  hasSpeakers,
  hasSubline,
  hasSublineAndTypesSection,
  hasTags,
  hasTypes,
  SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM,
  SEARCH_SPEAKERS_SEARCH_PARAM,
  SEARCH_TEAM_MEMBERS_SEARCH_PARAM,
} from "./about.shared";

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

  const { speakersSubmission, speakers } = await getSpeakersOfEvent({
    slug: params.slug,
    authClient,
    sessionUser,
    searchParams,
    optionalWhereClause: optionalSpeakerWhereClause,
  });

  const { teamMembersSubmission, responsibleOrganizationsSubmission, event } =
    await getEventBySlug({
      slug: params.slug,
      authClient,
      sessionUser,
      searchParams,
      locales: locales.route.error,
    });

  return {
    locales,
    event: {
      ...event,
      speakers,
    },
    speakersSubmission,
    teamMembersSubmission,
    responsibleOrganizationsSubmission,
  };
}

function About() {
  const {
    event,
    locales,
    speakersSubmission,
    teamMembersSubmission,
    responsibleOrganizationsSubmission,
  } = useLoaderData<typeof loader>();

  const [speakers, setSpeakers] = useState(event.speakers);
  const [teamMembers, setTeamMembers] = useState(event.teamMembers);
  const [responsibleOrganizations, setResponsibleOrganizations] = useState(
    event.responsibleOrganizations
  );

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
          <List
            id="speakers-list"
            hideAfter={4}
            locales={locales.route.list}
            multiColumnAt="md"
          >
            <List.Search
              id="speakers-search-form"
              defaultItems={event.speakers}
              setValues={setSpeakers}
              searchParam={SEARCH_SPEAKERS_SEARCH_PARAM}
              locales={{
                placeholder: locales.route.speakers.searchPlaceholder,
              }}
              hideUntil={4}
              label={locales.route.speakers.searchPlaceholder}
              submission={speakersSubmission}
              schema={getSearchSpeakersSchema()}
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
      <div className="w-full flex flex-col gap-4">
        <HeadlineContainer as="h3">
          {locales.route.teamMembers.headline}
        </HeadlineContainer>
        <List
          id="teamMembers-list"
          hideAfter={4}
          locales={locales.route.list}
          multiColumnAt="md"
        >
          <List.Search
            id="teamMembers-search-form"
            defaultItems={event.teamMembers}
            setValues={setTeamMembers}
            searchParam={SEARCH_TEAM_MEMBERS_SEARCH_PARAM}
            locales={{
              placeholder: locales.route.teamMembers.searchPlaceholder,
            }}
            hideUntil={4}
            label={locales.route.teamMembers.searchPlaceholder}
            submission={teamMembersSubmission}
            schema={getSearchTeamMembersSchema()}
          />
          {teamMembers.map((member, index) => {
            return (
              <ListItemPersonOrg
                key={member.id}
                index={index}
                to={`/profile/${member.username}`}
              >
                <ListItemPersonOrg.Avatar size="full" {...member} />
                <ListItemPersonOrg.Headline>
                  {member.academicTitle !== null &&
                  member.academicTitle.length > 0
                    ? `${member.academicTitle} `
                    : ""}
                  {member.firstName} {member.lastName}
                </ListItemPersonOrg.Headline>
                {member.position !== null ? (
                  <ListItemPersonOrg.Subline>
                    {member.position}
                  </ListItemPersonOrg.Subline>
                ) : null}
              </ListItemPersonOrg>
            );
          })}
        </List>
      </div>
      {hasResponsibleOrganizations(event) ? (
        <div className="w-full flex flex-col gap-4">
          <HeadlineContainer as="h3">
            {locales.route.responsibleOrganizations.headline}
          </HeadlineContainer>
          <List
            id="responsible-organizations-list"
            hideAfter={4}
            locales={locales.route.list}
            multiColumnAt="md"
          >
            <List.Search
              id="responsible-organization-search-form"
              defaultItems={event.responsibleOrganizations}
              setValues={setResponsibleOrganizations}
              searchParam={SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM}
              locales={{
                placeholder:
                  locales.route.responsibleOrganizations.searchPlaceholder,
              }}
              hideUntil={4}
              label={locales.route.responsibleOrganizations.searchPlaceholder}
              submission={responsibleOrganizationsSubmission}
              schema={getSearchResponsibleOrganizationsSchema()}
            />
            {responsibleOrganizations.map((organization, index) => {
              return (
                <ListItemPersonOrg
                  key={organization.id}
                  index={index}
                  to={`/organization/${organization.slug}/detail/about`}
                >
                  <ListItemPersonOrg.Avatar size="full" {...organization} />
                  <ListItemPersonOrg.Headline>
                    {organization.name}
                  </ListItemPersonOrg.Headline>
                  {organization.types.length > 0 ||
                  organization.networkTypes.length > 0 ? (
                    <ListItemPersonOrg.Subline>
                      {[
                        ...organization.types.map((relation) => {
                          return getLocaleFromSlug(
                            relation.organizationType.slug,
                            locales.organizationTypes
                          );
                        }),
                        ...organization.networkTypes.map((relation) => {
                          return getLocaleFromSlug(
                            relation.networkType.slug,
                            locales.networkTypes
                          );
                        }),
                      ].join(", ")}
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
