import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar"; // refactor?
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { Image as ImageComponent } from "@mint-vernetzt/components/src/molecules/Image"; // refactor?
import { Input } from "@mint-vernetzt/components/src/molecules/Input"; // refactor?
import classNames from "classnames";
import { utcToZonedTime } from "date-fns-tz";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Form, Link, useLocation } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import type { SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { ImageAspects, MaxImageSizes, MinCropSizes } from "~/images.shared";
import { copyToClipboard } from "~/lib/utils/clipboard";
import { getDateDuration, getTimeDuration } from "~/lib/utils/time";
import type { ArrayElement } from "~/lib/utils/types";
import type { languageModuleMap } from "~/locales/.server";
import {
  ABUSE_REPORT_INTENT,
  createAbuseReportSchema,
  REPORT_REASON_MAX_LENGTH,
} from "~/routes/event/$slug/details.shared";
import { Modal } from "../../components-next/Modal"; // refactor?
import ImageCropper, {
  type ImageCropperLocales,
} from "../legacy/ImageCropper/ImageCropper";
import { RichText } from "../legacy/Richtext/RichText"; // refactor?
import { OverlayMenu as OverlayMenuComponent } from "./OverlayMenu"; // refactor?
import { hasContent } from "~/utils.shared";

// Design:
// Name: Events_Overview
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10820-11125&t=QaQ9E7QzJ3dcYKtd-4
function EventsOverview(props: { children: React.ReactNode }) {
  return <div className="flex flex-col relative">{props.children}</div>;
}

function Image(props: { src?: string; alt?: string; blurredSrc?: string }) {
  return (
    <div className="relative h-full md:h-100 aspect-3/2 border-x border-t border-neutral-200 rounded-t-2xl overflow-hidden">
      <ImageComponent
        alt={props.alt}
        src={props.src}
        blurredSrc={props.blurredSrc}
        resizeType="fit"
      />
    </div>
  );
}

function Container(props: { children: React.ReactNode }) {
  return (
    <div className="p-6 bg-white border-x border-b border-neutral-200 rounded-b-2xl">
      <div className="flex flex-wrap gap-2 md:gap-6">{props.children}</div>
    </div>
  );
}

function InfoContainer(props: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 order-2 xl:order-last w-full">
      {props.children}
    </div>
  );
}

function EventName(props: { children: React.ReactNode }) {
  return (
    <div className="flex items-center order-1 w-full xl:w-auto xl:grow">
      <h1 className="text-primary font-bold text-3xl/7 m-0 max-w-200">
        {props.children}
      </h1>
    </div>
  );
}

function ResponsibleOrganizations(props: {
  organizations: Array<{
    name: string;
    slug: string;
    logo?: string | null;
    blurredLogo?: string;
  }>;
  locales: (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >]["event/$slug/detail"];
}) {
  const { organizations, locales } = props;

  if (hasContent(organizations) === false) {
    return null;
  }

  return (
    <div className="flex gap-4 align-center py-4 md:px-4 border-0 md:border border-neutral-200 rounded-lg">
      <div className="flex gap-1">
        <div className="flex -space-x-2">
          {organizations.slice(0, 2).map((organization, index) => {
            return (
              <div
                key={`organization-invite-${organization.slug}-${index}`}
                className="w-12 h-12"
              >
                <Avatar
                  to={`/organization/${organization.slug}/detail/about`}
                  size="full"
                  prefetch="intent"
                  {...organization}
                />
              </div>
            );
          })}
        </div>

        {organizations.length > 2 && (
          <div className="text-2xl font-semibold text-neutral-700 self-center">
            +{organizations.length - 2}
          </div>
        )}
      </div>
      <div className="font-semibold text-neutral-700 self-center line-clamp-1">
        {organizations.length > 1
          ? locales.route.content.jointEvent
          : organizations[0].name}
      </div>
    </div>
  );
}

function PeriodOfTime(props: {
  startTime: Date;
  endTime: Date;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
  slug: string;
}) {
  const { startTime, endTime } = props;

  const isSameDay =
    startTime.getFullYear() === endTime.getFullYear() &&
    startTime.getMonth() === endTime.getMonth() &&
    startTime.getDate() === endTime.getDate();

  const zonedStartTime = utcToZonedTime(startTime, "Europe/Berlin");

  const zonedEndTime = utcToZonedTime(endTime, "Europe/Berlin");

  const dateDuration = getDateDuration(
    zonedStartTime,
    zonedEndTime,
    props.language
  );

  const timeDuration = getTimeDuration(
    zonedStartTime,
    zonedEndTime,
    props.language
  );

  return (
    <div className="flex gap-4 align-center py-4 md:px-4 border-0 md:border border-neutral-200 rounded-lg order-2">
      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
        <div className="relative w-6 h-6 text-neutral-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
            className="absolute top-0 left-0"
          >
            <path
              d="M21 0.666687H3C1.34315 0.666687 0 2.00983 0 3.66669V21.6667C0 23.3235 1.34315 24.6667 3 24.6667H21C22.6569 24.6667 24 23.3235 24 21.6667V3.66669C24 2.00983 22.6569 0.666687 21 0.666687ZM1.5 6.4524C1.5 5.74232 2.17157 5.16669 3 5.16669H21C21.8284 5.16669 22.5 5.74232 22.5 6.4524V21.881C22.5 22.5911 21.8284 23.1667 21 23.1667H3C2.17157 23.1667 1.5 22.5911 1.5 21.881V6.4524Z"
              fill="currentColor"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="13"
            viewBox="0 0 18 13"
            fill="none"
            className="absolute top-2 left-0.75"
          >
            <path
              d="M6.75 3.16669C7.57843 3.16669 8.25 2.49511 8.25 1.66669C8.25 0.83826 7.57843 0.166687 6.75 0.166687C5.92157 0.166687 5.25 0.83826 5.25 1.66669C5.25 2.49511 5.92157 3.16669 6.75 3.16669Z"
              fill="#4D5970"
            />
            <path
              d="M11.25 3.16669C12.0784 3.16669 12.75 2.49511 12.75 1.66669C12.75 0.83826 12.0784 0.166687 11.25 0.166687C10.4216 0.166687 9.75 0.83826 9.75 1.66669C9.75 2.49511 10.4216 3.16669 11.25 3.16669Z"
              fill="#4D5970"
            />
            <path
              d="M15.75 3.16669C16.5784 3.16669 17.25 2.49511 17.25 1.66669C17.25 0.83826 16.5784 0.166687 15.75 0.166687C14.9216 0.166687 14.25 0.83826 14.25 1.66669C14.25 2.49511 14.9216 3.16669 15.75 3.16669Z"
              fill="#4D5970"
            />
            <path
              d="M2.25 7.66669C3.07843 7.66669 3.75 6.99511 3.75 6.16669C3.75 5.33826 3.07843 4.66669 2.25 4.66669C1.42157 4.66669 0.75 5.33826 0.75 6.16669C0.75 6.99511 1.42157 7.66669 2.25 7.66669Z"
              fill="#4D5970"
            />
            <path
              d="M6.75 7.66669C7.57843 7.66669 8.25 6.99511 8.25 6.16669C8.25 5.33826 7.57843 4.66669 6.75 4.66669C5.92157 4.66669 5.25 5.33826 5.25 6.16669C5.25 6.99511 5.92157 7.66669 6.75 7.66669Z"
              fill="#4D5970"
            />
            <path
              d="M11.25 7.66669C12.0784 7.66669 12.75 6.99511 12.75 6.16669C12.75 5.33826 12.0784 4.66669 11.25 4.66669C10.4216 4.66669 9.75 5.33826 9.75 6.16669C9.75 6.99511 10.4216 7.66669 11.25 7.66669Z"
              fill="#4D5970"
            />
            <path
              d="M15.75 7.66669C16.5784 7.66669 17.25 6.99511 17.25 6.16669C17.25 5.33826 16.5784 4.66669 15.75 4.66669C14.9216 4.66669 14.25 5.33826 14.25 6.16669C14.25 6.99511 14.9216 7.66669 15.75 7.66669Z"
              fill="#4D5970"
            />
            <path
              d="M2.25 12.1667C3.07843 12.1667 3.75 11.4951 3.75 10.6667C3.75 9.83826 3.07843 9.16669 2.25 9.16669C1.42157 9.16669 0.75 9.83826 0.75 10.6667C0.75 11.4951 1.42157 12.1667 2.25 12.1667Z"
              fill="#4D5970"
            />
            <path
              d="M6.75 12.1667C7.57843 12.1667 8.25 11.4951 8.25 10.6667C8.25 9.83826 7.57843 9.16669 6.75 9.16669C5.92157 9.16669 5.25 9.83826 5.25 10.6667C5.25 11.4951 5.92157 12.1667 6.75 12.1667Z"
              fill="#4D5970"
            />
            <path
              d="M11.25 12.1667C12.0784 12.1667 12.75 11.4951 12.75 10.6667C12.75 9.83826 12.0784 9.16669 11.25 9.16669C10.4216 9.16669 9.75 9.83826 9.75 10.6667C9.75 11.4951 10.4216 12.1667 11.25 12.1667Z"
              fill="#4D5970"
            />
          </svg>
        </div>
      </div>
      <div className="flex flex-col self-center text-neutral-700 grow">
        <div className="font-semibold line-clamp-1">{dateDuration}</div>
        {isSameDay ? (
          <div className="font-normal line-clamp-1">{timeDuration}</div>
        ) : null}
      </div>
      <CircleButton
        as="link"
        to={`/event/${props.slug}/ics-download`}
        reloadDocument
        variant="ghost"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M0.625 12.375C0.970178 12.375 1.25 12.6549 1.25 13V16.125C1.25 16.8154 1.80964 17.375 2.5 17.375H17.5C18.1904 17.375 18.75 16.8154 18.75 16.125V13C18.75 12.6549 19.0298 12.375 19.375 12.375C19.7202 12.375 20 12.6549 20 13V16.125C20 17.5057 18.8807 18.625 17.5 18.625H2.5C1.11929 18.625 0 17.5057 0 16.125V13C0 12.6549 0.279822 12.375 0.625 12.375Z"
            fill="currentColor"
          />
          <path
            d="M9.55806 14.8169C9.80214 15.061 10.1979 15.061 10.4419 14.8169L14.1919 11.0669C14.436 10.8229 14.436 10.4271 14.1919 10.1831C13.9479 9.93898 13.5521 9.93898 13.3081 10.1831L10.625 12.8661V1.875C10.625 1.52982 10.3452 1.25 10 1.25C9.65482 1.25 9.375 1.52982 9.375 1.875V12.8661L6.69194 10.1831C6.44786 9.93898 6.05214 9.93898 5.80806 10.1831C5.56398 10.4271 5.56398 10.8229 5.80806 11.0669L9.55806 14.8169Z"
            fill="currentColor"
          />
        </svg>
      </CircleButton>
    </div>
  );
}

function Stage(props: {
  slug: string;
  venueName: string | null;
  venueStreet: string | null;
  venueZipCode: string | null;
  venueCity: string | null;
  stage:
    | keyof (typeof languageModuleMap)[ArrayElement<
        typeof SUPPORTED_COOKIE_LANGUAGES
      >]["event/$slug/detail"]["stages"]
    | null;
  conferenceLinkToBeAnnounced: boolean;
  conferenceLink: string | null;
  locales: (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >]["event/$slug/detail"];
}) {
  const { stage, conferenceLinkToBeAnnounced, conferenceLink, slug } = props;
  if (hasContent(stage) === false) {
    return null;
  }

  const containerClasses = classNames(
    "group flex gap-4 align-center py-4 md:px-4",
    "border-0 md:border border-neutral-200 rounded-lg",
    "order-3 md:order-last",
    (stage === "online" || stage === "hybrid") &&
      (conferenceLinkToBeAnnounced === true || hasContent(conferenceLink))
      ? "focus:ring-2 focus:ring-primary-200 hover:bg-neutral-100 active:bg-primary-50 focus:outline-none"
      : ""
  );

  const iconClasses = classNames(
    "w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0 text-neutral-700",
    (stage === "online" || stage === "hybrid") &&
      (conferenceLinkToBeAnnounced === true || hasContent(conferenceLink))
      ? "group-hover:bg-white"
      : ""
  );

  if (stage === "online") {
    const children = (
      <>
        <div className={iconClasses}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M0.400391 9.9999C0.400391 7.45382 1.41182 5.01203 3.21217 3.21168C5.01252 1.41133 7.45431 0.399902 10.0004 0.399902C12.5465 0.399902 14.9883 1.41133 16.7886 3.21168C18.589 5.01203 19.6004 7.45382 19.6004 9.9999C19.6004 12.546 18.589 14.9878 16.7886 16.7881C14.9883 18.5885 12.5465 19.5999 10.0004 19.5999C7.45431 19.5999 5.01252 18.5885 3.21217 16.7881C1.41182 14.9878 0.400391 12.546 0.400391 9.9999V9.9999ZM9.40039 1.6923C8.59639 1.9371 7.79839 2.6763 7.13599 3.9183C6.96439 4.2399 6.80479 4.5903 6.66199 4.9647C7.50799 5.1531 8.42839 5.2731 9.40039 5.3091V1.6923ZM5.49919 4.6467C5.66959 4.1859 5.86399 3.7539 6.07639 3.3531C6.28388 2.96077 6.5235 2.58629 6.79279 2.2335C5.77119 2.65686 4.84309 3.2775 4.06159 4.0599C4.49599 4.2807 4.97719 4.4787 5.49919 4.6479V4.6467ZM4.61119 9.3999C4.65439 8.1159 4.83679 6.8955 5.13439 5.7903C4.48483 5.58257 3.8561 5.31461 3.25639 4.9899C2.30064 6.27313 1.73338 7.80375 1.62199 9.3999H4.60999H4.61119ZM6.29119 6.1107C6.00829 7.18562 5.84728 8.28897 5.81119 9.3999H9.40039V6.5091C8.30839 6.4731 7.26079 6.3351 6.29119 6.1107ZM10.6004 6.5079V9.3999H14.1884C14.1527 8.28901 13.9921 7.18566 13.7096 6.1107C12.74 6.3351 11.6924 6.4719 10.6004 6.5091V6.5079ZM5.81239 10.5999C5.85439 11.7843 6.02359 12.8967 6.29119 13.8891C7.31246 13.6573 8.35365 13.5243 9.40039 13.4919V10.5999H5.81239ZM10.6004 10.5999V13.4907C11.6924 13.5267 12.74 13.6647 13.7096 13.8891C13.9772 12.8967 14.1464 11.7843 14.1896 10.5999H10.6004ZM6.66199 15.0351C6.80599 15.4095 6.96439 15.7599 7.13599 16.0815C7.79839 17.3235 8.59759 18.0615 9.40039 18.3075V14.6919C8.42839 14.7279 7.50799 14.8479 6.66199 15.0363V15.0351ZM6.79399 17.7663C6.52427 17.4136 6.28424 17.0391 6.07639 16.6467C5.85538 16.2284 5.66255 15.7959 5.49919 15.3519C5.00555 15.5105 4.52492 15.7071 4.06159 15.9399C4.84309 16.7223 5.77119 17.3429 6.79279 17.7663H6.79399ZM5.13439 14.2095C4.82284 13.0302 4.6469 11.8191 4.60999 10.5999H1.62199C1.73331 12.1961 2.30058 13.7267 3.25639 15.0099C3.82039 14.7003 4.45039 14.4315 5.13439 14.2095V14.2095ZM13.208 17.7663C14.2291 17.3432 15.1568 16.723 15.938 15.9411C15.4751 15.7084 14.9948 15.5118 14.5016 15.3531C14.3382 15.7967 14.1454 16.2288 13.9244 16.6467C13.717 17.0391 13.4773 17.4136 13.208 17.7663V17.7663ZM10.6004 14.6907V18.3075C11.4044 18.0627 12.2024 17.3235 12.8648 16.0815C13.0364 15.7599 13.196 15.4095 13.3388 15.0351C12.4383 14.8377 11.5217 14.7228 10.6004 14.6919V14.6907ZM14.8664 14.2095C15.5504 14.4315 16.1804 14.7003 16.7444 15.0099C17.7002 13.7267 18.2675 12.1961 18.3788 10.5999H15.3908C15.3539 11.8191 15.1779 13.0302 14.8664 14.2095V14.2095ZM18.3788 9.3999C18.2675 7.80374 17.7002 6.27309 16.7444 4.9899C16.1804 5.2995 15.5504 5.5683 14.8664 5.7903C15.164 6.8943 15.3464 8.1159 15.3908 9.3999H18.3788ZM13.9244 3.3531C14.1368 3.7539 14.3312 4.1859 14.5028 4.6467C14.9956 4.488 15.4755 4.29141 15.938 4.0587C15.1566 3.27729 14.229 2.65749 13.208 2.2347C13.4696 2.5743 13.7096 2.9511 13.9244 3.3531V3.3531ZM13.3388 4.9647C13.2025 4.60649 13.0442 4.25702 12.8648 3.9183C12.2024 2.6763 11.4044 1.9383 10.6004 1.6923V5.3079C11.5724 5.2719 12.4928 5.1519 13.3388 4.9635V4.9647Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="self-center text-neutral-700 font-semibold">
          {props.locales.route.content.online}
        </div>
      </>
    );
    if (
      props.conferenceLinkToBeAnnounced === true ||
      hasContent(conferenceLink)
    ) {
      return (
        <Link
          to={`/event/${slug}/detail/about#address-and-conference-link`}
          className={containerClasses}
          prefetch="intent"
        >
          {children}
        </Link>
      );
    }
    return <div className={containerClasses}>{children}</div>;
  }

  if (stage === "on-site") {
    const children = (
      <>
        <div className={iconClasses}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect width="24" height="24" rx="8" fill="none" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3 20.2499V10.4999H4.5V20.2499C4.5 20.6641 4.83579 20.9999 5.25 20.9999H18.75C19.1642 20.9999 19.5 20.6641 19.5 20.2499V10.4999H21V20.2499C21 21.4925 19.9926 22.4999 18.75 22.4999H5.25C4.00736 22.4999 3 21.4925 3 20.2499Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M19.5 3.74989V8.99989L16.5 5.99989V3.74989C16.5 3.33567 16.8358 2.99989 17.25 2.99989H18.75C19.1642 2.99989 19.5 3.33567 19.5 3.74989Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.9393 2.24989C11.5251 1.6641 12.4749 1.6641 13.0607 2.24989L23.0303 12.2196C23.3232 12.5124 23.3232 12.9873 23.0303 13.2802C22.7374 13.5731 22.2626 13.5731 21.9697 13.2802L12 3.31055L2.03033 13.2802C1.73744 13.5731 1.26256 13.5731 0.96967 13.2802C0.676777 12.9873 0.676777 12.5124 0.96967 12.2196L10.9393 2.24989Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="self-center text-neutral-700 flex flex-col grow">
          <div className=" font-semibold line-clamp-1">
            {hasContent(props.venueName)
              ? props.venueName
              : props.locales.route.content.onSite}
          </div>
          {hasContent(props.venueStreet) &&
            hasContent(props.venueZipCode) &&
            hasContent(props.venueCity) && (
              <div className="font-normal line-clamp-1">
                {props.venueStreet}, {props.venueZipCode} {props.venueCity}
              </div>
            )}
        </div>
        {hasContent(props.venueStreet) &&
          hasContent(props.venueZipCode) &&
          hasContent(props.venueCity) && (
            <CircleButton
              as="link"
              variant="ghost"
              target="_blank"
              rel="noopener noreferrer"
              to={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${props.venueStreet} ${props.venueZipCode} ${props.venueCity}`)}`}
            >
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
                  d="M8.47727 4.625C8.47727 4.41789 8.30938 4.25 8.10227 4.25H3.125C2.50368 4.25 2 4.75368 2 5.375V12.875C2 13.4963 2.50368 14 3.125 14H10.625C11.2463 14 11.75 13.4963 11.75 12.875V7.89773C11.75 7.69062 11.5821 7.52273 11.375 7.52273C11.1679 7.52273 11 7.69062 11 7.89773V12.875C11 13.0821 10.8321 13.25 10.625 13.25H3.125C2.91789 13.25 2.75 13.0821 2.75 12.875V5.375C2.75 5.16789 2.91789 5 3.125 5H8.10227C8.30938 5 8.47727 4.83211 8.47727 4.625Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.3"
                  strokeLinecap="round"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M14 2.375C14 2.16789 13.8321 2 13.625 2H9.875C9.66789 2 9.5 2.16789 9.5 2.375C9.5 2.58211 9.66789 2.75 9.875 2.75H12.7197L6.60983 8.85983C6.46339 9.00628 6.46339 9.24372 6.60983 9.39017C6.75628 9.53661 6.99372 9.53661 7.14017 9.39017L13.25 3.28033V6.125C13.25 6.33211 13.4179 6.5 13.625 6.5C13.8321 6.5 14 6.33211 14 6.125V2.375Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </CircleButton>
          )}
      </>
    );
    return <div className={containerClasses}>{children}</div>;
  }

  if (stage === "hybrid") {
    const children = (
      <>
        <div className={`${iconClasses} gap-px`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 13.4999V6.99992H3V13.4999C3 13.7761 3.22386 13.9999 3.5 13.9999H12.5C12.7761 13.9999 13 13.7761 13 13.4999V6.99992H14V13.4999C14 14.3284 13.3284 14.9999 12.5 14.9999H3.5C2.67157 14.9999 2 14.3284 2 13.4999Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13 2.49992V5.99992L11 3.99992V2.49992C11 2.22378 11.2239 1.99992 11.5 1.99992H12.5C12.7761 1.99992 13 2.22378 13 2.49992Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.29289 1.49992C7.68342 1.1094 8.31658 1.1094 8.70711 1.49992L15.3536 8.14637C15.5488 8.34163 15.5488 8.65822 15.3536 8.85348C15.1583 9.04874 14.8417 9.04874 14.6464 8.85348L8 2.20703L1.35355 8.85348C1.15829 9.04874 0.841709 9.04874 0.646447 8.85348C0.451184 8.65822 0.451184 8.34163 0.646447 8.14637L7.29289 1.49992Z"
              fill="currentColor"
            />
          </svg>
          <span>/</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8ZM7.5 1.07655C6.83057 1.28128 6.16462 1.89722 5.61275 2.93199C5.43997 3.25594 5.283 3.61363 5.14499 3.99999H7.5V1.07655ZM4.08954 3.99999C4.26796 3.44139 4.48325 2.92479 4.73039 2.4614C4.90911 2.1263 5.10862 1.81241 5.32726 1.52835C4.08119 2.04354 3.01629 2.90813 2.25469 3.99999H4.08954ZM3.50845 7.49999C3.53819 6.62317 3.6457 5.7817 3.82001 4.99999H1.67363C1.30933 5.76687 1.08035 6.61049 1.01758 7.49999H3.50845ZM4.84686 4.99999C4.66006 5.76497 4.54152 6.60778 4.50906 7.49999H7.5V4.99999H4.84686ZM8.5 4.99999V7.49999H11.4909C11.4585 6.60778 11.3399 5.76497 11.1531 4.99999H8.5ZM4.50906 8.49999C4.54152 9.39221 4.66006 10.235 4.84686 11H7.5V8.49999H4.50906ZM8.5 8.49999V11H11.1531C11.3399 10.235 11.4585 9.39221 11.4909 8.49999H8.5ZM5.14499 12C5.283 12.3864 5.43997 12.744 5.61275 13.068C6.16462 14.1028 6.83057 14.7187 7.5 14.9234V12H5.14499ZM5.32726 14.4716C5.10863 14.1876 4.90911 13.8737 4.73039 13.5386C4.48325 13.0752 4.26796 12.5586 4.08954 12H2.25469C3.01629 13.0919 4.08119 13.9565 5.32726 14.4716ZM3.82001 11C3.6457 10.2183 3.53819 9.37682 3.50845 8.49999H1.01758C1.08035 9.3895 1.30933 10.2331 1.67363 11H3.82001ZM10.6727 14.4716C11.9188 13.9565 12.9837 13.0919 13.7453 12H11.9104C11.732 12.5586 11.5167 13.0752 11.2696 13.5386C11.0909 13.8737 10.8914 14.1876 10.6727 14.4716ZM8.5 12V14.9234C9.16942 14.7187 9.83537 14.1028 10.3872 13.068C10.56 12.744 10.717 12.3864 10.855 12H8.5ZM12.18 11H14.3264C14.6907 10.2331 14.9196 9.3895 14.9824 8.49999H12.4915C12.4618 9.37682 12.3543 10.2183 12.18 11ZM14.9824 7.49999C14.9196 6.61049 14.6907 5.76687 14.3264 4.99999H12.18C12.3543 5.7817 12.4618 6.62317 12.4915 7.49999H14.9824ZM11.2696 2.4614C11.5167 2.92479 11.732 3.44139 11.9104 3.99999H13.7453C12.9837 2.90812 11.9188 2.04353 10.6727 1.52835C10.8914 1.81241 11.0909 2.1263 11.2696 2.4614ZM10.855 3.99999C10.717 3.61363 10.56 3.25594 10.3872 2.93199C9.83537 1.89722 9.16942 1.28128 8.5 1.07655V3.99999H10.855Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="self-center text-neutral-700 flex flex-col">
          <div className=" font-semibold line-clamp-1">
            {hasContent(props.venueName)
              ? props.venueName
              : props.locales.route.content.hybrid}
          </div>
          {hasContent(props.venueStreet) &&
            hasContent(props.venueZipCode) &&
            hasContent(props.venueCity) && (
              <>
                <div className="font-normal line-clamp-1">
                  {props.locales.stages.online.title} / {props.venueStreet},{" "}
                  {props.venueZipCode} {props.venueCity}
                </div>
              </>
            )}
        </div>
      </>
    );
    if (
      props.conferenceLinkToBeAnnounced === true ||
      hasContent(conferenceLink) ||
      (hasContent(props.venueStreet) &&
        hasContent(props.venueZipCode) &&
        hasContent(props.venueCity))
    ) {
      return (
        <Link
          to={`/event/${slug}/detail/about#address-and-conference-link`}
          className={containerClasses}
          prefetch="intent"
        >
          {children}
        </Link>
      );
    }
    return <div className={containerClasses}>{children}</div>;
  }

  return null;
}

function FreeSeats(props: {
  participantLimit: number | null;
  participantsCount: number;
  locales: (typeof languageModuleMap)[ArrayElement<
    typeof SUPPORTED_COOKIE_LANGUAGES
  >]["event/$slug/detail"];
}) {
  const { participantLimit, participantsCount, locales } = props;

  return (
    <div className="flex gap-4 align-center py-4 md:px-4 border-0 md:border border-neutral-200 rounded-lg">
      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M22.5 21C22.5 21 24 21 24 19.5C24 18 22.5 13.5 16.5 13.5C10.5 13.5 9 18 9 19.5C9 21 10.5 21 10.5 21H22.5ZM10.5335 19.5C10.5283 19.4994 10.521 19.4984 10.5122 19.497C10.5081 19.4963 10.504 19.4955 10.5 19.4948C10.5022 19.0987 10.7503 17.9504 11.6389 16.9137C12.47 15.944 13.924 15 16.5 15C19.076 15 20.53 15.944 21.3611 16.9137C22.2497 17.9504 22.4978 19.0987 22.5 19.4948C22.496 19.4955 22.4919 19.4963 22.4878 19.497C22.479 19.4984 22.4717 19.4994 22.4665 19.5H10.5335Z"
            fill="currentColor"
          />
          <path
            d="M16.5 10.5C18.1569 10.5 19.5 9.15685 19.5 7.5C19.5 5.84315 18.1569 4.5 16.5 4.5C14.8431 4.5 13.5 5.84315 13.5 7.5C13.5 9.15685 14.8431 10.5 16.5 10.5ZM21 7.5C21 9.98528 18.9853 12 16.5 12C14.0147 12 12 9.98528 12 7.5C12 5.01472 14.0147 3 16.5 3C18.9853 3 21 5.01472 21 7.5Z"
            fill="currentColor"
          />
          <path
            d="M10.4039 13.9199C9.8522 13.7435 9.2393 13.6152 8.55942 13.5496C8.22292 13.5171 7.87002 13.5 7.5 13.5C1.5 13.5 0 18 0 19.5C0 20.5 0.5 21 1.5 21H7.82454C7.61334 20.5739 7.5 20.0687 7.5 19.5C7.5 17.9846 8.06587 16.437 9.13473 15.1443C9.4999 14.7026 9.9238 14.2907 10.4039 13.9199ZM7.38006 15.0007C6.48383 16.3704 6 17.932 6 19.5H1.5C1.5 19.1089 1.74637 17.955 2.63888 16.9137C3.45703 15.9592 4.87874 15.0295 7.38006 15.0007Z"
            fill="currentColor"
          />
          <path
            d="M2.25 8.25C2.25 5.76472 4.26472 3.75 6.75 3.75C9.23528 3.75 11.25 5.76472 11.25 8.25C11.25 10.7353 9.23528 12.75 6.75 12.75C4.26472 12.75 2.25 10.7353 2.25 8.25ZM6.75 5.25C5.09315 5.25 3.75 6.59315 3.75 8.25C3.75 9.90685 5.09315 11.25 6.75 11.25C8.40685 11.25 9.75 9.90685 9.75 8.25C9.75 6.59315 8.40685 5.25 6.75 5.25Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="flex flex-col self-center text-neutral-700">
        <div className="font-semibold line-clamp-1">
          {hasContent(participantLimit) === false
            ? locales.route.content.unlimitedSeats
            : `${participantsCount > participantLimit ? 0 : participantLimit - participantsCount} / ${participantLimit} ${locales.route.content.seatsFree}`}
        </div>
        {hasContent(participantLimit) &&
          participantsCount >= participantLimit && (
            <div className="line-clamp-1">
              {locales.route.content.waitingListAvailable}
            </div>
          )}
      </div>
    </div>
  );
}

function State(props: {
  children: React.ReactNode;
  tint?: "neutral" | "primary";
}) {
  const { tint = "primary" } = props;

  const classes = classNames(
    "w-full border-x border-neutral-200 h-10 flex items-center justify-center px-4 text-xs font-semibold tracking-[0.0225rem] line-clamp-1",
    tint === "neutral" && "bg-neutral-100 text-neutral-700",
    tint === "primary" && "bg-primary-50 text-primary-500"
  );

  return <div className={classes}>{props.children}</div>;
}

function StateFlag(props: {
  children: React.ReactNode;
  tint?: "primary" | "negative";
}) {
  const { tint = "primary" } = props;

  return (
    <div className="absolute top-0 left-0 w-full h-40 rounded-t-2xl text-white font-semibold overflow-hidden">
      <div
        className={classNames(
          "w-full h-9.75 flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(0,0,0,0.16)]",
          tint === "primary" && "bg-primary-400",
          tint === "negative" && "bg-negative-700"
        )}
      >
        {props.children}
      </div>
    </div>
  );
}

function ButtonStates(props: { children: React.ReactNode }) {
  return (
    <div className="w-full xl:w-auto flex justify-center order-last xl:order-1">
      <div className="flex flex-row-reverse justify-center xl:justify-end gap-2 mt-4 md:mt-0 w-full md:w-fit">
        {props.children}
      </div>
    </div>
  );
}

const OverlayMenuContext = createContext<{
  baseUrl: string;
  overlayMenuId: string;
} | null>(null);

function useOverlayMenuContext() {
  const context = useContext(OverlayMenuContext);
  if (!context) {
    throw new Error(
      "SquareButton compound components cannot be rendered outside the SquareButton component"
    );
  }
  return context;
}

function OverlayMenu(props: {
  baseUrl: string;
  children: React.ReactNode;
  overlayMenuId: string;
  locales: {
    overlayMenu: {
      close: string;
    };
  };
}) {
  return (
    <OverlayMenuContext
      value={{ baseUrl: props.baseUrl, overlayMenuId: props.overlayMenuId }}
    >
      <OverlayMenuComponent
        searchParam={props.overlayMenuId}
        size="medium"
        locales={props.locales.overlayMenu}
      >
        {props.children}
      </OverlayMenuComponent>
    </OverlayMenuContext>
  );
}

function CopyURLToClipboard(props: {
  locales: { copy: string; copied: string };
}) {
  // make available for other sites (means wrong location imho)?

  const [hasCopied, setHasCopied] = useState(false);
  const location = useLocation();
  const { baseUrl, overlayMenuId } = useOverlayMenuContext();

  const handleCopyToClipboard = async () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete(overlayMenuId);
    const newSearch = searchParams.toString();

    const url = new URL(location.pathname, baseUrl);
    url.search = newSearch;
    url.hash = location.hash;

    await copyToClipboard(url.toString());
    setHasCopied(true);
  };

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  return (
    <OverlayMenuComponent.ListItem>
      <button
        {...OverlayMenuComponent.getIdToFocusWhenOpening()}
        {...OverlayMenuComponent.getListChildrenStyles()}
        onClick={handleCopyToClipboard}
      >
        <span className="p-1">
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.68849 6.83637L1.88774 8.63712C1.14925 9.37561 0.734375 10.3772 0.734375 11.4216C0.734375 12.466 1.14925 13.4676 1.88774 14.2061C2.62623 14.9445 3.62783 15.3594 4.67221 15.3594C5.71659 15.3594 6.71819 14.9445 7.45668 14.2061L9.85593 11.8055C10.3013 11.3601 10.6332 10.8144 10.824 10.2142C11.0148 9.61392 11.0588 8.97667 10.9523 8.3559C10.8459 7.73514 10.5921 7.14897 10.2122 6.64659C9.8323 6.14422 9.33746 5.74031 8.76918 5.46875L8.00005 6.23787C7.92197 6.3161 7.85406 6.40385 7.79793 6.49906C8.23699 6.62528 8.63552 6.86391 8.9541 7.19135C9.27268 7.51879 9.50029 7.92371 9.61443 8.36607C9.72856 8.80843 9.72528 9.27292 9.60489 9.71362C9.4845 10.1543 9.25118 10.556 8.92799 10.8789L6.53005 13.2781C6.0375 13.7707 5.36945 14.0474 4.67286 14.0474C3.97628 14.0474 3.30823 13.7707 2.81568 13.2781C2.32312 12.7856 2.0464 12.1175 2.0464 11.4209C2.0464 10.7244 2.32312 10.0563 2.81568 9.56375L3.85649 8.52425C3.70964 7.97395 3.65291 7.40481 3.68849 6.83637Z"
              fill="#4D5970"
            />
            <path
              d="M6.14404 4.38199C5.69871 4.82738 5.36673 5.3731 5.17595 5.97334C4.98517 6.57358 4.94116 7.21082 5.04763 7.83159C5.15409 8.45235 5.40791 9.03852 5.78778 9.5409C6.16766 10.0433 6.66251 10.4472 7.23079 10.7187L8.24797 9.70024C7.80297 9.58088 7.39722 9.34649 7.07149 9.02063C6.74577 8.69477 6.51155 8.28893 6.39238 7.84387C6.2732 7.39881 6.27326 6.93023 6.39255 6.4852C6.51184 6.04018 6.74617 5.63439 7.07197 5.30862L9.46991 2.90937C9.96247 2.41681 10.6305 2.14009 11.3271 2.14009C12.0237 2.14009 12.6917 2.41681 13.1843 2.90937C13.6768 3.40192 13.9536 4.06997 13.9536 4.76655C13.9536 5.46313 13.6768 6.13118 13.1843 6.62374L12.1435 7.66324C12.2905 8.21449 12.3469 8.78543 12.3115 9.35243L14.1122 7.55168C14.8507 6.81319 15.2656 5.81159 15.2656 4.76721C15.2656 3.72283 14.8507 2.72123 14.1122 1.98274C13.3737 1.24425 12.3721 0.829376 11.3278 0.829376C10.2834 0.829376 9.28177 1.24425 8.54329 1.98274L6.14404 4.38199Z"
              fill="#4D5970"
            />
          </svg>
        </span>
        <span>
          {hasCopied === false ? props.locales.copy : props.locales.copied}
        </span>
      </button>
    </OverlayMenuComponent.ListItem>
  );
}

function ReportEvent(props: {
  modalName?: string;
  alreadyReported: boolean;
  locales: {
    report: string;
    reported: string;
    reportFaq: string;
  };
}) {
  const location = useLocation();

  let modalName = "modal-report";
  if (typeof props.modalName === "string") {
    if (props.modalName.startsWith("modal-")) {
      modalName = props.modalName;
    } else {
      modalName = `modal-${props.modalName}`;
    }
  }

  return (
    <OverlayMenuComponent.ListItem disabled={props.alreadyReported}>
      <Form
        method="get"
        action={location.pathname}
        preventScrollReset
        className="w-full"
      >
        <input
          type="hidden"
          name={modalName}
          defaultValue="true"
          aria-label={props.locales.report}
          aria-hidden="true"
        />
        <button
          {...OverlayMenuComponent.getListChildrenStyles()}
          type="submit"
          disabled={props.alreadyReported === true}
        >
          {props.alreadyReported === false ? (
            <span className="p-0.5">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.4731 0.10593C18.6462 0.221985 18.75 0.416642 18.75 0.625V10C18.75 10.2556 18.5944 10.4854 18.3571 10.5803L18.125 10C18.3571 10.5803 18.3572 10.5803 18.3571 10.5803L18.3539 10.5816L18.3462 10.5846L18.3176 10.5959C18.2929 10.6056 18.257 10.6196 18.2109 10.6373C18.1187 10.6726 17.9859 10.7227 17.821 10.7827C17.4916 10.9025 17.0321 11.0623 16.5119 11.2224C15.4927 11.536 14.1644 11.875 13.125 11.875C12.0666 11.875 11.1896 11.5241 10.4277 11.2192L10.3929 11.2053C9.60032 10.8883 8.92543 10.625 8.125 10.625C7.24981 10.625 6.07698 10.9116 5.07819 11.2219C4.58838 11.374 4.15731 11.5264 3.84886 11.6407C3.81431 11.6535 3.78133 11.6659 3.75 11.6776V19.375C3.75 19.7202 3.47018 20 3.125 20C2.77982 20 2.5 19.7202 2.5 19.375V0.625C2.5 0.279822 2.77982 0 3.125 0C3.47018 0 3.75 0.279822 3.75 0.625V0.977815C4.03263 0.878926 4.37015 0.765844 4.73807 0.652638C5.75727 0.339038 7.08564 0 8.125 0C9.17594 0 10.0299 0.346159 10.7762 0.648704C10.7944 0.656068 10.8125 0.663406 10.8305 0.670712C11.6073 0.985329 12.2848 1.25 13.125 1.25C14.0002 1.25 15.173 0.963423 16.1718 0.653138C16.6616 0.500975 17.0927 0.34858 17.4011 0.234265C17.5552 0.177178 17.6782 0.129766 17.762 0.0968685C17.8039 0.0804242 17.8361 0.0676203 17.8574 0.0590629L17.8811 0.0494923L17.8866 0.0472411L17.8878 0.0467559M17.5 1.52804C17.2255 1.62545 16.8992 1.7361 16.5427 1.84686C15.5296 2.16158 14.2024 2.5 13.125 2.5C12.0172 2.5 11.1349 2.14262 10.3707 1.83311L10.3613 1.82929C9.57736 1.51179 8.92348 1.25 8.125 1.25C7.28936 1.25 6.11773 1.53596 5.10568 1.84736C4.61026 1.9998 4.17125 2.15248 3.85617 2.26706C3.81899 2.28058 3.78356 2.29356 3.75 2.30593V10.347C4.0245 10.2495 4.35082 10.1389 4.70735 10.0281C5.7204 9.71342 7.04757 9.375 8.125 9.375C9.1834 9.375 10.0604 9.72593 10.8223 10.0308L10.8571 10.0447C11.6497 10.3617 12.3246 10.625 13.125 10.625C13.9606 10.625 15.1323 10.339 16.1443 10.0276C16.6397 9.8752 17.0788 9.72252 17.3938 9.60794C17.431 9.59442 17.4664 9.58144 17.5 9.56907V1.52804Z"
                  fill="#4D5970"
                />
              </svg>
            </span>
          ) : (
            <CircleButton
              as="link"
              to="/help#events-iReportedAnEvent"
              target="_blank"
              size="x-small"
              variant="outline"
              aria-label={props.locales.reportFaq}
              prefetch="intent"
            >
              <div aria-hidden="true" className="flex flex-col gap-px">
                <div className="w-0.5 h-0.5 bg-primary rounded-lg" />
                <div className="w-0.5 h-2 bg-primary rounded-lg" />
              </div>
            </CircleButton>
          )}
          <span>
            {props.alreadyReported === false
              ? props.locales.report
              : props.locales.reported}
          </span>
        </button>
      </Form>
    </OverlayMenuComponent.ListItem>
  );
}

function AbuseReportModal(props: {
  modalName?: string;
  locales: {
    title: string;
    description: string;
    faq: string;
    submit: string;
    otherReason: string;
    maxLength: string;
    abort: string;
    eventAbuseReportReasonSuggestions: {
      [key: string]: { description: string };
    };
  };
  reasons: { slug: string; description: string }[];
}) {
  let modalName = "modal-report";
  if (typeof props.modalName === "string") {
    if (props.modalName.startsWith("modal-")) {
      modalName = props.modalName;
    } else {
      modalName = `modal-${props.modalName}`;
    }
  }

  const now = useRef(Date.now());

  const [form, fields] = useForm({
    id: `abuse-report-form-${now.current}`,
    constraint: getZodConstraint(createAbuseReportSchema(props.locales)),
    defaultValue: {
      [INTENT_FIELD_NAME]: ABUSE_REPORT_INTENT,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate: (args) => {
      const { formData } = args;
      const submission = parseWithZod(formData, {
        schema: createAbuseReportSchema(props.locales),
      });
      return submission;
    },
  });

  const isHydrated = useHydrated();
  const location = useLocation();

  return (
    <Modal searchParam={modalName}>
      <Modal.Title>
        <span className="text-5xl leading-9">{props.locales.title}</span>
      </Modal.Title>
      <Modal.Section>
        {props.locales.description}
        <RichText html={props.locales.faq} />
      </Modal.Section>
      <Modal.Section>
        <Form {...getFormProps(form)} method="post" preventScrollReset>
          <input
            {...getInputProps(fields[INTENT_FIELD_NAME], {
              type: "hidden",
            })}
            key={ABUSE_REPORT_INTENT}
            aria-label={props.locales.submit}
            aria-hidden="true"
          />
          <input type="hidden" name="redirectTo" value={location.pathname} />
          <div className="flex flex-col gap-6">
            {props.reasons.map((reason) => {
              let description;
              if (
                reason.slug in props.locales.eventAbuseReportReasonSuggestions
              ) {
                type LocaleKey =
                  keyof typeof props.locales.eventAbuseReportReasonSuggestions;
                description =
                  props.locales.eventAbuseReportReasonSuggestions[
                    reason.slug as LocaleKey
                  ].description;
              } else {
                console.error(
                  `Event abuse report reason suggestion ${reason.slug} not found in locales`
                );
                description = reason.slug;
              }
              return (
                <label key={reason.slug} className="flex group">
                  <input
                    {...getInputProps(fields.reasons, {
                      type: "checkbox",
                      value: reason.slug,
                    })}
                    key={reason.slug}
                    className="h-0 w-0 opacity-0"
                  />
                  <div className="w-5 h-5 relative mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 20 20"
                      className="block group-has-checked:hidden"
                    >
                      <path
                        fill="currentColor"
                        d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                      />
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 20 20"
                      className="hidden group-has-checked:block"
                    >
                      <path
                        fill="currentColor"
                        d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                      />
                      <path
                        fill="currentColor"
                        d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold">{description}</span>
                </label>
              );
            })}
            <Input
              {...getInputProps(fields.otherReason, {
                type: "text",
              })}
              maxLength={REPORT_REASON_MAX_LENGTH}
            >
              <Input.Label htmlFor={fields.otherReason.id}>
                {props.locales.otherReason}
              </Input.Label>
              {hasContent(fields.reasons.errors)
                ? fields.reasons.errors.map((error) => (
                    <Input.Error id={fields.reasons.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </div>
        </Form>
      </Modal.Section>
      <Modal.SubmitButton
        form={form.id} // Don't disable button when js is disabled
        disabled={
          isHydrated ? form.dirty === false || form.valid === false : false
        }
      >
        {props.locales.submit}
      </Modal.SubmitButton>
      <Modal.CloseButton>{props.locales.abort}</Modal.CloseButton>
    </Modal>
  );
}

function Edit(props: { children: React.ReactNode; slug: string }) {
  return (
    <Button
      as="link"
      to={`/event/${props.slug}/settings/general`}
      prefetch="intent"
      fullSize
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M15.1831 0.183058C15.4272 -0.0610194 15.8229 -0.0610194 16.067 0.183058L19.817 3.93306C20.061 4.17714 20.061 4.57286 19.817 4.81694L7.31696 17.3169C7.25711 17.3768 7.18573 17.4239 7.10714 17.4553L0.857137 19.9553C0.625002 20.0482 0.359866 19.9937 0.183076 19.8169C0.00628736 19.6402 -0.0481339 19.375 0.0447203 19.1429L2.54472 12.8929C2.57616 12.8143 2.62323 12.7429 2.68308 12.6831L15.1831 0.183058ZM14.0089 3.125L16.875 5.99112L18.4911 4.375L15.625 1.50888L14.0089 3.125ZM15.9911 6.875L13.125 4.00888L5.00002 12.1339V12.5H5.62502C5.9702 12.5 6.25002 12.7798 6.25002 13.125V13.75H6.87502C7.2202 13.75 7.50002 14.0298 7.50002 14.375V15H7.86613L15.9911 6.875ZM3.78958 13.3443L3.65767 13.4762L1.74693 18.2531L6.52379 16.3423L6.6557 16.2104C6.41871 16.1216 6.25002 15.893 6.25002 15.625V15H5.62502C5.27984 15 5.00002 14.7202 5.00002 14.375V13.75H4.37502C4.10701 13.75 3.87841 13.5813 3.78958 13.3443Z"
          fill="currentColor"
        />
      </svg>
      {props.children}
    </Button>
  );
}

function Login(props: { children: React.ReactNode; pathname: string }) {
  return (
    <Button
      as="link"
      to={`/login?login_redirect=${encodeURIComponent(props.pathname)}`}
      fullSize
      prefetch="intent"
    >
      {props.children}
    </Button>
  );
}

function Participate(props: { children: React.ReactNode; profileId?: string }) {
  const location = useLocation();
  if (typeof props.profileId === "undefined") {
    return null;
  }

  return (
    <Form method="post" preventScrollReset>
      <input type="hidden" name="profileId" defaultValue={props.profileId} />
      <input type="hidden" name="redirectTo" value={location.pathname} />
      <Button
        type="submit"
        name={INTENT_FIELD_NAME}
        value="participate"
        fullSize
      >
        {props.children}
      </Button>
    </Form>
  );
}

function WithdrawParticipation(props: {
  children: React.ReactNode;
  profileId?: string;
}) {
  const location = useLocation();
  if (typeof props.profileId === "undefined") {
    return null;
  }

  return (
    <Form method="post" preventScrollReset>
      <input type="hidden" name="profileId" defaultValue={props.profileId} />
      <input type="hidden" name="redirectTo" value={location.pathname} />
      <Button
        type="submit"
        name={INTENT_FIELD_NAME}
        value="withdrawParticipation"
        fullSize
        variant="outline"
      >
        {props.children}
      </Button>
    </Form>
  );
}

function JoinWaitingList(props: {
  children: React.ReactNode;
  profileId?: string;
}) {
  const location = useLocation();
  if (typeof props.profileId === "undefined") {
    return null;
  }

  return (
    <Form method="post" preventScrollReset>
      <input type="hidden" name="profileId" defaultValue={props.profileId} />
      <input type="hidden" name="redirectTo" value={location.pathname} />
      <Button
        type="submit"
        name={INTENT_FIELD_NAME}
        value="joinWaitingList"
        fullSize
      >
        {props.children}
      </Button>
    </Form>
  );
}

function LeaveWaitingList(props: {
  children: React.ReactNode;
  profileId?: string;
}) {
  const location = useLocation();
  if (typeof props.profileId === "undefined") {
    return null;
  }

  return (
    <Form method="post" preventScrollReset>
      <input type="hidden" name="profileId" defaultValue={props.profileId} />
      <input type="hidden" name="redirectTo" value={location.pathname} />
      <Button
        type="submit"
        name={INTENT_FIELD_NAME}
        value="leaveWaitingList"
        fullSize
        variant="outline"
      >
        {props.children}
      </Button>
    </Form>
  );
}

function EditBackground(props: {
  modalName?: string;
  locales: { changeBackground: string };
}) {
  const location = useLocation();

  let modalName = "modal-edit-background";
  if (typeof props.modalName === "string") {
    if (props.modalName.startsWith("modal-")) {
      modalName = props.modalName;
    } else {
      modalName = `modal-${props.modalName}`;
    }
  }

  return (
    <div className="absolute top-0 left-0 w-full h-59.75 md:h-100 rounded-t-2xl overflow-hidden">
      <div className="relative w-full h-full xl:aspect-3/2 xl:w-auto xl:m-auto opacity-0 hover:opacity-100">
        <div className="absolute w-full h-full bg-neutral-700 opacity-70" />
        <div className="absolute flex m-auto w-full h-full items-start xl:items-end justify-end p-4">
          <Form method="get" preventScrollReset action={location.pathname}>
            <input
              hidden
              name={modalName}
              defaultValue="true"
              aria-hidden="true"
              aria-label={props.locales.changeBackground}
            />
            <div className="hidden xl:block">
              <Button type="submit" variant="outline" size="small">
                <span>
                  <svg
                    className="hidden xl:block"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M6.00159 5.5C6.00159 6.32843 5.33001 7 4.50159 7C3.67316 7 3.00159 6.32843 3.00159 5.5C3.00159 4.67157 3.67316 4 4.50159 4C5.33001 4 6.00159 4.67157 6.00159 5.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M2.00159 1C0.897017 1 0.00158691 1.89543 0.00158691 3V13C0.00158691 14.1046 0.897017 15 2.00159 15H14.0016C15.1062 15 16.0016 14.1046 16.0016 13V3C16.0016 1.89543 15.1062 1 14.0016 1H2.00159ZM14.0016 2C14.5539 2 15.0016 2.44772 15.0016 3V9.50001L11.2252 7.5528C11.0327 7.45655 10.8002 7.49428 10.648 7.64646L6.93788 11.3566L4.27894 9.58399C4.08063 9.45178 3.81657 9.47793 3.64803 9.64646L1.00159 12V3C1.00159 2.44772 1.4493 2 2.00159 2H14.0016Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>Bild bearbeiten</span>
              </Button>
            </div>
            <div className="xl:hidden w-10 h-10">
              <CircleButton
                type="submit"
                aria-label={props.locales.changeBackground}
                variant="outline"
                fullSize
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M15 12C15 12.5523 14.5523 13 14 13H2C1.44772 13 1 12.5523 1 12V6C1 5.44772 1.44772 5 2 5H3.17157C3.96722 5 4.73028 4.68393 5.29289 4.12132L6.12132 3.29289C6.30886 3.10536 6.56321 3 6.82843 3H9.17157C9.43679 3 9.69114 3.10536 9.87868 3.29289L10.7071 4.12132C11.2697 4.68393 12.0328 5 12.8284 5H14C14.5523 5 15 5.44772 15 6V12ZM2 4C0.895431 4 0 4.89543 0 6V12C0 13.1046 0.895431 14 2 14H14C15.1046 14 16 13.1046 16 12V6C16 4.89543 15.1046 4 14 4H12.8284C12.298 4 11.7893 3.78929 11.4142 3.41421L10.5858 2.58579C10.2107 2.21071 9.70201 2 9.17157 2H6.82843C6.29799 2 5.78929 2.21071 5.41421 2.58579L4.58579 3.41421C4.21071 3.78929 3.70201 4 3.17157 4H2Z"
                    fill="#154194"
                  />
                  <path
                    d="M8 11C6.61929 11 5.5 9.88071 5.5 8.5C5.5 7.11929 6.61929 6 8 6C9.38071 6 10.5 7.11929 10.5 8.5C10.5 9.88071 9.38071 11 8 11ZM8 12C9.933 12 11.5 10.433 11.5 8.5C11.5 6.567 9.933 5 8 5C6.067 5 4.5 6.567 4.5 8.5C4.5 10.433 6.067 12 8 12Z"
                    fill="#154194"
                  />
                  <path
                    d="M3 6.5C3 6.77614 2.77614 7 2.5 7C2.22386 7 2 6.77614 2 6.5C2 6.22386 2.22386 6 2.5 6C2.77614 6 3 6.22386 3 6.5Z"
                    fill="#154194"
                  />
                </svg>
              </CircleButton>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

function EditBackgroundModal(props: {
  background?: string;
  blurredBackground?: string;
  modalName?: string;
  locales: {
    title: string;
    alt: string;
  } & ImageCropperLocales;
  currentTimestamp: number;
}) {
  const location = useLocation();

  let modalName = "modal-edit-background";
  if (typeof props.modalName === "string") {
    if (props.modalName.startsWith("modal-")) {
      modalName = props.modalName;
    } else {
      modalName = `modal-${props.modalName}`;
    }
  }

  return (
    <Modal searchParam={modalName}>
      <Modal.Title>{props.locales.title}</Modal.Title>
      <Modal.Section>
        <ImageCropper
          uploadKey="background"
          image={props.background}
          aspect={ImageAspects.EventBackground}
          minCropWidth={MinCropSizes.EventBackground.width}
          minCropHeight={MinCropSizes.EventBackground.height}
          maxTargetWidth={MaxImageSizes.EventBackground.width}
          maxTargetHeight={MaxImageSizes.EventBackground.height}
          modalSearchParam="modal-background"
          locales={props.locales}
          currentTimestamp={props.currentTimestamp}
          redirectTo={location.pathname}
        >
          <div className="w-full rounded-md overflow-hidden aspect-3/2">
            <ImageComponent
              alt={props.locales.alt}
              src={props.background}
              blurredSrc={props.blurredBackground}
            />
          </div>
        </ImageCropper>
      </Modal.Section>
    </Modal>
  );
}

OverlayMenu.CopyURLToClipboard = CopyURLToClipboard;
OverlayMenu.ReportEvent = ReportEvent;
EventsOverview.EditBackgroundModal = EditBackgroundModal;
EventsOverview.EditBackground = EditBackground;
EventsOverview.AbuseReportModal = AbuseReportModal;
EventsOverview.Participate = Participate;
EventsOverview.WithdrawParticipation = WithdrawParticipation;
EventsOverview.JoinWaitingList = JoinWaitingList;
EventsOverview.LeaveWaitingList = LeaveWaitingList;
EventsOverview.Edit = Edit;
EventsOverview.Login = Login;
EventsOverview.State = State;
EventsOverview.StateFlag = StateFlag;
EventsOverview.OverlayMenu = OverlayMenu;
EventsOverview.ButtonStates = ButtonStates;
EventsOverview.FreeSeats = FreeSeats;
EventsOverview.Stage = Stage;
EventsOverview.PeriodOfTime = PeriodOfTime;
EventsOverview.ResponsibleOrganizations = ResponsibleOrganizations;
EventsOverview.EventName = EventName;
EventsOverview.InfoContainer = InfoContainer;
EventsOverview.Image = Image;
EventsOverview.Container = Container;

export default EventsOverview;
