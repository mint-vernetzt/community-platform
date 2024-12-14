import { Link } from "@remix-run/react";
import classNames from "classnames";
import { removeHtmlTags } from "~/lib/utils/sanitizeUserHtml";
import { getDuration } from "~/lib/utils/time";
import { utcToZonedTime } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import React from "react";

function ListItemImage(props: {
  src: string;
  blurredSrc: string;
  alt: string;
}) {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const blurredImgRef = React.useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [blurredImgLoaded, setBlurredImgLoaded] = React.useState(false);

  React.useEffect(() => {
    if (imgRef.current !== null && imgRef.current.complete) {
      setImgLoaded(true);
    }
    if (blurredImgRef.current !== null && blurredImgRef.current.complete) {
      setBlurredImgLoaded(true);
    }
  }, []);

  const baseClasses =
    "mv-w-full mv-h-full mv-object-cover mv-absolute mv-inset-0";
  const blurredClasses = classNames(
    baseClasses,
    blurredImgLoaded
      ? "mv-opacity-100 mv-transition-opacity mv-duration-200 mv-ease-in"
      : "mv-opacity-0 mv-invisible"
  );
  const classes = classNames(
    baseClasses,
    imgLoaded
      ? "mv-opacity-100 mv-transition-opacity mv-duration-200 mv-ease-in"
      : "mv-opacity-0 mv-invisible mv-h-0 mv-w-0"
  );

  return (
    <div className="mv-hidden @lg:mv-block mv-w-36 mv-shrink-0 mv-aspect-[3/2] mv-bg-neutral-200">
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

function EventListItemFlag(props: { canceled?: boolean; published?: boolean }) {
  const { t } = useTranslation([
    "routes-my-events",
    "components",
    "datasets-stages",
  ]);

  const classes = classNames(
    "mv-flex mv-font-semibold mv-items-center mv-ml-auto mv-border-r-8 mv-pr-4 mv-py-6",
    props.canceled
      ? "mv-border-negative-500 mv-text-negative-500"
      : !props.published
      ? "mv-border-primary-300 mv-text-primary-300"
      : ""
  );

  return typeof props.canceled === "boolean" && props.canceled ? (
    <div className={classes}>
      {t("EventListItemFlag.canceled", { ns: "components" })}
    </div>
  ) : typeof props.published === "boolean" && props.published === false ? (
    <div className={classes}>
      {t("EventListItemFlag.draft", { ns: "components" })}
    </div>
  ) : null;
}

function EventListItemContent(props: {
  event: {
    name: string;
    subline: string | null;
    description: string | null;
    stage: { slug: string } | null;
    startTime: string;
    endTime: string;
    participantLimit: number | null;
    _count: {
      participants: number;
      waitingList: number;
    };
    canceled?: boolean;
    published?: boolean;
  };
}) {
  const { event } = props;

  const { t, i18n } = useTranslation([
    "routes-my-events",
    "components",
    "datasets-stages",
  ]);

  const startTime = utcToZonedTime(event.startTime, "Europe/Berlin");
  const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");

  return (
    <>
      <div className="mv-py-4 mv-px-4">
        <p className="text-xs mb-1">
          {event.stage !== null
            ? t(`${event.stage.slug}.title`, { ns: "datasets-stages" }) + " | "
            : ""}
          {getDuration(startTime, endTime, i18n.language)}

          {event.participantLimit === null &&
            ` | ${t("EventListItemContent.unlimitedSeats", {
              ns: "components",
            })}`}
          {event.participantLimit !== null &&
            event.participantLimit - event._count.participants > 0 &&
            ` | ${event.participantLimit - event._count.participants} / ${
              event.participantLimit
            } ${t("EventListItemContent.seatsFree", { ns: "components" })}`}

          {event.participantLimit !== null &&
          event.participantLimit - event._count.participants <= 0 ? (
            <>
              {" "}
              |{" "}
              <span>
                {event._count.waitingList}{" "}
                {t("EventListItemContent.onWaitingList", { ns: "components" })}
              </span>
            </>
          ) : null}
        </p>
        <h4 className="font-bold text-base m-0 @lg:mv-line-clamp-1">
          {event.name}
        </h4>
        {event.subline !== null ? (
          <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
            {event.subline}
          </p>
        ) : (
          <p className="mv-hidden text-xs mt-1 @lg:mv-line-clamp-1">
            {removeHtmlTags(event.description ?? "")}
          </p>
        )}
      </div>
      <EventListItemFlag
        canceled={event.canceled}
        published={event.published}
      />
    </>
  );
}

export function EventListItem(
  props: React.PropsWithChildren<{
    to: string;
    listIndex: number;
    hideAfter?: number;
  }>
) {
  const classes = classNames(
    "mv-rounded-lg mv-bg-white mv-border mv-border-neutral-200 mv-overflow-hidden",
    props.hideAfter !== undefined && props.listIndex > props.hideAfter - 1
      ? "mv-hidden group-has-[:checked]:mv-block"
      : "mv-block"
  );

  return (
    <li className={classes}>
      <Link to={props.to} className="mv-flex mv-items-stretch">
        {props.children}
      </Link>
    </li>
  );
}

EventListItem.Image = ListItemImage;
EventListItem.Content = EventListItemContent;
