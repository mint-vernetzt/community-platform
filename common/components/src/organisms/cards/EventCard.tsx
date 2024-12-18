import React from "react";
import { removeHtmlTags } from "../../../../../app/lib/utils/sanitizeUserHtml";
import { Avatar, AvatarList } from "../../molecules/Avatar";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardInfo,
  CardInfoOverlay,
  CardStatus,
} from "./Card";
import { getDateDuration, getTimeDuration } from "~/lib/utils/time";
import { Image } from "../../molecules/Image";
import { type DashboardLocales } from "~/routes/dashboard.server";
import { type ArrayElement } from "~/lib/utils/types";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { decideBetweenSingularOrPlural } from "~/lib/utils/i18n";
import { type ExploreEventsLocales } from "~/routes/explore/events.server";

export type EventCardProps = {
  match?: number;
  publicAccess?: boolean;
  locales: DashboardLocales | ExploreEventsLocales;
  currentLanguage: ArrayElement<typeof supportedCookieLanguages>;
  event: {
    name: string;
    slug: string;
    startTime: Date;
    endTime: Date;
    participationUntil: Date;
    subline?: string | null;
    description?: string | null;
    published: boolean;
    canceled: boolean;
    background?: string | null;
    blurredBackground?: string;
    participantLimit?: number | null;
    stage?: { slug: string } | null;
    _count: {
      participants: number;
      waitingList: number;
      childEvents: number;
    };
    responsibleOrganizations: {
      name: string;
      slug: string;
      logo?: string | null;
    }[];
    isParticipant: boolean;
    isOnWaitingList: boolean;
    isSpeaker: boolean;
    isTeamMember: boolean;
  };
  participateControl?: React.ReactElement;
  waitingListControl?: React.ReactElement;
};

function IconOnSite() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
      />
      <path
        fillRule="evenodd"
        d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"
      />
    </svg>
  );
}

function IconOnline() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z" />
    </svg>
  );
}

function IconHybrid() {
  return (
    <>
      <IconOnSite />
      <span className="mv-mx-1">/</span>
      <IconOnline />
    </>
  );
}

function EventCard(
  props: React.ButtonHTMLAttributes<HTMLDivElement> & EventCardProps
) {
  const { event, locales, currentLanguage } = props;

  const now = new Date();

  const dateDuration = getDateDuration(
    event.startTime,
    event.endTime,
    currentLanguage
  );
  const timeDuration = getTimeDuration(
    event.startTime,
    event.endTime,
    currentLanguage
  );

  const getEventStageElement = (
    loc: typeof locales,
    stage: NonNullable<typeof event.stage>
  ) => {
    let title;
    if (stage.slug in loc.stages === false) {
      console.error(`Event stage ${stage.slug} not found in locales`);
      title = stage.slug;
    } else {
      type LocaleKey = keyof typeof loc.stages;
      title = loc.stages[stage.slug as LocaleKey].title;
    }
    return (
      <>
        {stage.slug === "on-site" ? (
          <IconOnSite />
        ) : stage.slug === "online" ? (
          <IconOnline />
        ) : (
          <IconHybrid />
        )}
        <span className="mv-ml-1">{title}</span>
      </>
    );
  };

  return (
    <Card to={`/event/${event.slug}`}>
      <CardHeader cardType="event">
        {event.background && (
          <Image
            alt={event.name}
            src={event.background}
            blurredSrc={event.blurredBackground}
          />
        )}
        {props.match !== undefined && (
          <CardStatus>
            {props.match}% {locales.eventCard.match}
          </CardStatus>
        )}
        {event.canceled && event.published && (
          <CardStatus variant="negative">
            {locales.eventCard.cancelled}
          </CardStatus>
        )}
        {event.endTime.getTime() < now.getTime() && (
          <CardStatus variant="neutral">{locales.eventCard.passed}</CardStatus>
        )}
        {!event.published && event.isTeamMember && (
          <CardStatus variant="primary" inverted>
            {locales.eventCard.draft}
          </CardStatus>
        )}
        {event.published && event.isTeamMember && (
          <CardStatus variant="positive">
            {locales.eventCard.published}
          </CardStatus>
        )}
        <CardInfoOverlay>
          {event._count.childEvents === 0 &&
          event.startTime.getDate() === event.endTime.getDate() &&
          event.startTime.getMonth() === event.endTime.getMonth() &&
          event.startTime.getFullYear() === event.endTime.getFullYear() ? (
            <span className="mv-text-xs mv-text-neutral-200 mv-font-semibold mv-px-2 mv-py-1 mv-rounded-lg mv-bg-primary">
              {timeDuration}
            </span>
          ) : (
            <span></span>
          )}
          {event._count.childEvents === 0 &&
            typeof event.participantLimit !== "number" && (
              <span className="mv-text-xs mv-text-neutral-200 mv-font-semibold mv-px-2 mv-py-1 mv-rounded-lg mv-bg-primary">
                {locales.eventCard.seats.unlimited}
              </span>
            )}
          {event._count.childEvents === 0 &&
            typeof event.participantLimit === "number" &&
            event.participantLimit - event._count.participants > 0 && (
              <span className="mv-text-xs mv-text-neutral-200 mv-font-semibold mv-px-2 mv-py-1 mv-rounded-lg mv-bg-primary">
                {event.participantLimit - event._count.participants} /{" "}
                {event.participantLimit}{" "}
                {decideBetweenSingularOrPlural(
                  locales.eventCard.seats.free_one,
                  locales.eventCard.seats.free_other,
                  event.participantLimit
                )}
              </span>
            )}
          {event._count.childEvents === 0 &&
            typeof event.participantLimit === "number" &&
            event.participantLimit - event._count.participants <= 0 && (
              <span className="mv-text-xs mv-text-neutral-200 mv-font-semibold mv-px-2 mv-py-1 mv-rounded-lg mv-bg-primary">
                {event._count.waitingList}{" "}
                {decideBetweenSingularOrPlural(
                  locales.eventCard.waitingList.places_one,
                  locales.eventCard.waitingList.places_other,
                  event._count.waitingList
                )}
              </span>
            )}
        </CardInfoOverlay>
        <CardInfo>
          <span className="mv-inline-block mv-text-sm mv-font-semibold mv-truncate">
            {dateDuration}
          </span>
          <span className="mv-flex mv-items-center mv-text-sm mv-font-semibold">
            {typeof event.stage !== "undefined" && event.stage !== null
              ? getEventStageElement(locales, event.stage)
              : null}
          </span>
        </CardInfo>
      </CardHeader>
      <CardBody>
        {
          <div className="mv-min-h-[80px]">
            {/* TODO: */}
            {/* Issue with combination of line clamp with ellipsis (truncate) */}
            {/* Maybe find a better solution */}
            <div className="mv-max-h-10 mv-overflow-hidden">
              <h4 className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-text-ellipsis mv-overflow-hidden">
                {event.name}
              </h4>
            </div>
            <div className="mv-h-9">
              {(event.subline || event.description) && (
                <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-line-clamp-2 mv-px">
                  {event.subline || removeHtmlTags(event.description ?? "")}
                </p>
              )}
            </div>
          </div>
        }
      </CardBody>
      <CardFooter>
        <AvatarList
          visibleAvatars={2}
          moreIndicatorProps={{
            to: `/event/${event.slug}/#responsible-organizations`,
          }}
        >
          {event.responsibleOrganizations.map((organization) => {
            return (
              <Avatar
                key={organization.slug}
                {...organization}
                size="sm"
                to={`/organization/${organization.slug}`}
              />
            );
          })}
        </AvatarList>
        {!props.publicAccess &&
          props.participateControl !== undefined &&
          event._count.childEvents === 0 &&
          event.published &&
          !event.canceled &&
          event.participationUntil.getTime() > Date.now() &&
          !event.isTeamMember &&
          !event.isSpeaker &&
          !event.isOnWaitingList &&
          !event.isParticipant &&
          (typeof event.participantLimit !== "number" ||
            (typeof event.participantLimit === "number" &&
              event.participantLimit - event._count.participants > 0)) &&
          props.participateControl}
        {!props.publicAccess &&
          props.waitingListControl !== undefined &&
          event._count.childEvents === 0 &&
          event.published &&
          !event.canceled &&
          event.participationUntil.getTime() > Date.now() &&
          !event.isTeamMember &&
          !event.isSpeaker &&
          !event.isOnWaitingList &&
          !event.isParticipant &&
          typeof event.participantLimit === "number" &&
          event.participantLimit - event._count.participants <= 0 &&
          props.waitingListControl}
        {!props.publicAccess &&
          event._count.childEvents === 0 &&
          event.published &&
          !event.canceled &&
          event.isParticipant && (
            <span className="mv-text-xs mv-font-bold mv-text-positive">
              {locales.eventCard.registered}
            </span>
          )}
        {!props.publicAccess &&
          event._count.childEvents === 0 &&
          event.published &&
          !event.canceled &&
          event.participationUntil.getTime() > Date.now() &&
          event.isOnWaitingList && (
            <span className="mv-text-xs mv-font-bold mv-text-neutral-700">
              {locales.eventCard.onWaitingList}
            </span>
          )}
      </CardFooter>
    </Card>
  );
}

export { EventCard };
