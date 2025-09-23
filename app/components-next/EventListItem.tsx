import { Link, type LinkProps } from "react-router";
import classNames from "classnames";
import { removeHtmlTags } from "~/lib/utils/transformHtml";
import { getDuration } from "~/lib/utils/time";
import { utcToZonedTime } from "date-fns-tz";
import { type ArrayElement } from "~/lib/utils/types";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type MyEventsLocales } from "~/routes/my/events.server";
import { type OrganizationEventsLocales } from "~/routes/organization/$slug/detail/events.server";
import { useEffect, useRef, useState } from "react";

function ListItemImage(props: {
  src: string;
  blurredSrc: string;
  alt: string;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const blurredImgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [blurredImgLoaded, setBlurredImgLoaded] = useState(false);

  useEffect(() => {
    if (imgRef.current !== null && imgRef.current.complete) {
      setImgLoaded(true);
    }
    if (blurredImgRef.current !== null && blurredImgRef.current.complete) {
      setBlurredImgLoaded(true);
    }
  }, []);

  const baseClasses = "w-full h-full object-cover absolute inset-0";
  const blurredClasses = classNames(
    baseClasses,
    blurredImgLoaded
      ? "opacity-100 transition-opacity duration-200 ease-in"
      : "opacity-0 invisible"
  );
  const classes = classNames(
    baseClasses,
    imgLoaded
      ? "opacity-100 transition-opacity duration-200 ease-in"
      : "opacity-0 invisible h-0 w-0"
  );

  return (
    <div className="hidden @lg:block w-36 shrink-0 aspect-[3/2] bg-neutral-200">
      <div className="w-36 h-full relative">
        <img
          ref={blurredImgRef}
          src={props.blurredSrc}
          alt=""
          onLoad={() => {
            setBlurredImgLoaded(true);
          }}
          className={blurredClasses}
        />
        <img
          ref={imgRef}
          src={props.src}
          alt={props.alt}
          onLoad={() => {
            setImgLoaded(true);
          }}
          className={classes}
        />
        <noscript>
          <img src={props.src} alt={props.alt} className={baseClasses} />
        </noscript>
      </div>
    </div>
  );
}

function EventListItemFlag(props: {
  canceled?: boolean;
  published?: boolean;
  locales: MyEventsLocales | OrganizationEventsLocales;
}) {
  const classes = classNames(
    "flex font-semibold items-center ml-auto border-r-8 pr-4 py-6",
    props.canceled
      ? "border-negative-500 text-negative-500"
      : !props.published
      ? "border-primary-300 text-primary-300"
      : "border-gray-200"
  );

  return typeof props.canceled === "boolean" && props.canceled ? (
    <div className={classes}>
      {props.locales.components.EventListItemFlag.canceled}
    </div>
  ) : typeof props.published === "boolean" && props.published === false ? (
    <div className={classes}>
      {props.locales.components.EventListItemFlag.draft}
    </div>
  ) : null;
}

function EventListItemContent(props: {
  event: {
    name: string;
    subline: string | null;
    description: string | null;
    stage: { slug: string } | null;
    startTime: Date;
    endTime: Date;
    participantLimit: number | null;
    _count: {
      participants: number;
      waitingList: number;
    };
    canceled?: boolean;
    published?: boolean;
  };
  currentLanguage: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
  locales: MyEventsLocales | OrganizationEventsLocales;
}) {
  const { event, currentLanguage, locales } = props;

  const startTime = utcToZonedTime(event.startTime, "Europe/Berlin");
  const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");

  return (
    <>
      <div className="py-4 px-4">
        <p className="text-xs mb-1">
          {event.stage !== null
            ? (() => {
                let title;
                if (event.stage.slug in locales.stages) {
                  type LocaleKey = keyof typeof locales.stages;
                  title = locales.stages[event.stage.slug as LocaleKey].title;
                } else {
                  console.error(
                    `Event stage ${event.stage.slug} not found in locales`
                  );
                  title = event.stage.slug;
                }
                return title;
              })() + " | "
            : ""}
          {getDuration(startTime, endTime, currentLanguage)}

          {event.participantLimit === null &&
            ` | ${locales.components.EventListItemContent.unlimitedSeats}`}
          {event.participantLimit !== null &&
            event.participantLimit - event._count.participants > 0 &&
            ` | ${event.participantLimit - event._count.participants} / ${
              event.participantLimit
            } ${locales.components.EventListItemContent.seatsFree}`}

          {event.participantLimit !== null &&
          event.participantLimit - event._count.participants <= 0 ? (
            <>
              {" "}
              |{" "}
              <span>
                {event._count.waitingList}{" "}
                {locales.components.EventListItemContent.onWaitingList}
              </span>
            </>
          ) : null}
        </p>
        <h4 className="font-bold text-base m-0 @lg:line-clamp-1">
          {event.name}
        </h4>
        {event.subline !== null ? (
          <p className="hidden text-xs mt-1 @lg:line-clamp-1">
            {event.subline}
          </p>
        ) : (
          <p className="hidden text-xs mt-1 @lg:line-clamp-1">
            {removeHtmlTags(event.description ?? "")}
          </p>
        )}
      </div>
      <EventListItemFlag
        canceled={event.canceled}
        published={event.published}
        locales={locales}
      />
    </>
  );
}

export function EventListItem(
  props: React.PropsWithChildren<{
    to: string;
    listIndex: number;
    hideAfter?: number;
    prefetch?: LinkProps["prefetch"];
  }>
) {
  const classes = classNames(
    "rounded-lg bg-white border border-neutral-200 overflow-hidden",
    props.hideAfter !== undefined && props.listIndex > props.hideAfter - 1
      ? "hidden group-has-[:checked]:block"
      : "block"
  );

  return (
    <li className={classes}>
      <Link
        to={props.to}
        className="flex items-stretch"
        prefetch={props.prefetch}
      >
        {props.children}
      </Link>
    </li>
  );
}

EventListItem.Image = ListItemImage;
EventListItem.Content = EventListItemContent;
