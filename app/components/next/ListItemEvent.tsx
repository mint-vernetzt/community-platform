import classNames from "classnames";
import { useListContext } from "./List";
import { Form, Link } from "react-router";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Children, isValidElement } from "react";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { getDateDuration, getTimeDuration } from "~/lib/utils/time";
import { INTENT_FIELD_NAME } from "~/form-helpers";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { utcToZonedTime } from "date-fns-tz";

function ListItemEvent(props: {
  children: React.ReactNode;
  index: number;
  to?: string;
}) {
  const { children, index, to } = props;
  const { hideAfter } = useListContext();

  const hideClasses = classNames(
    typeof hideAfter !== "undefined" && index > hideAfter - 1
      ? "hidden group-has-[:checked]:block"
      : "block"
  );

  const classes = classNames(
    "flex gap-4 items-center border border-neutral-200 rounded-lg bg-white"
  );

  const validChildren = Children.toArray(children).filter((child) => {
    return isValidElement(child);
  });

  const image = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemEvent.Image;
  });

  const headline = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemEvent.Headline;
  });

  const subline = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemEvent.Subline;
  });

  const info = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemEvent.Info;
  });

  const flag = validChildren.find((child) => {
    return isValidElement(child) && child.type === ListItemEvent.Flag;
  });

  const control = validChildren.find((child) => {
    return (
      isValidElement(child) &&
      (child.type === ListItemEvent.Control ||
        child.type === ListItemEvent.Controls)
    );
  });

  const infoContainerClasses = classNames(
    "w-full flex flex-col @sm:flex-row justify-center @sm:justify-between @sm:items-center p-4 gap-4",
    typeof image !== "undefined" ? "@lg:pl-0" : "",
    typeof control !== "undefined" ? "@sm:h-24" : "h-24"
  );

  if (typeof to === "undefined") {
    return (
      <li className={hideClasses}>
        <div className={classes}>
          {typeof image !== "undefined" ? (
            <div className="hidden @lg:block w-36 shrink-0 aspect-[3/2]">
              <div className="w-36 h-[96px] rounded-l-lg overflow-hidden">
                {image}
              </div>
            </div>
          ) : null}
          <div className={infoContainerClasses}>
            <div
              className={classNames(
                "flex flex-col max-w-[737px]",
                typeof subline !== "undefined"
                  ? "justify-between"
                  : "justify-start gap-1"
              )}
            >
              {info}
              {headline}
              {typeof subline !== "undefined" ? (
                <div className="hidden @sm:block">{subline}</div>
              ) : null}
            </div>
            {typeof control !== "undefined" ? (
              <div className="w-full @sm:w-auto flex justify-center @md:justify-end items-center">
                {control}
              </div>
            ) : null}
          </div>
          {flag}
        </div>
      </li>
    );
  }

  return (
    <li className={hideClasses}>
      <Link
        to={to}
        className={classNames(
          classes,
          "focus:ring-2 focus:ring-primary-200 hover:bg-neutral-100 active:bg-primary-50 focus:outline-none"
        )}
        prefetch="intent"
      >
        {typeof image !== "undefined" ? (
          <div className="hidden @lg:block w-36 shrink-0 aspect-[3/2]">
            <div className="w-36 h-[96px] rounded-l-[7px] overflow-hidden">
              {image}
            </div>
          </div>
        ) : null}
        <div className={infoContainerClasses}>
          <div
            className={classNames(
              "flex flex-col max-w-[737px]",
              typeof subline !== "undefined"
                ? "justify-between"
                : "justify-start gap-1"
            )}
          >
            {info}
            {headline}
            {typeof subline !== "undefined" ? (
              <div className="hidden @sm:block">{subline}</div>
            ) : null}
          </div>
          {typeof control !== "undefined" ? (
            <div className="w-full @sm:w-auto flex justify-center @md:justify-end items-center gap-4">
              {control}
            </div>
          ) : null}
        </div>
        {flag}
      </Link>
    </li>
  );
}

function ListItemHeadline(props: { children: React.ReactNode }) {
  return (
    <div className="text-primary-500 font-bold line-clamp-1">
      {props.children}
    </div>
  );
}

function ListItemSubline(props: { children: React.ReactNode }) {
  return (
    <div className="text-neutral-600 text-sm line-clamp-1">
      {props.children}
    </div>
  );
}

function ListItemInfo(props: {
  stage: { slug: string } | null;
  locales: {
    stages: {
      [key: string]: {
        title: string;
      };
    };
    waitinglist: string;
    seatsFree: string;
    unlimitedSeats: string;
  };
  startTime: Date;
  endTime: Date;
  participantLimit: number | null;
  participantCount: number;
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
}) {
  const { startTime, endTime } = props;
  const strings: string[] = [];
  if (props.stage !== null) {
    if (typeof props.locales.stages[props.stage.slug] === "undefined") {
      strings.push(props.stage.slug);
    } else {
      strings.push(props.locales.stages[props.stage.slug].title);
    }
  }

  const isSameDay =
    startTime.getFullYear() === endTime.getFullYear() &&
    startTime.getMonth() === endTime.getMonth() &&
    startTime.getDate() === endTime.getDate();

  const zonedStartTime = utcToZonedTime(startTime, "Europe/Berlin");
  const zonedEndTime = utcToZonedTime(endTime, "Europe/Berlin");

  strings.push(getDateDuration(zonedStartTime, zonedEndTime, props.language));
  if (isSameDay) {
    strings.push(getTimeDuration(zonedStartTime, zonedEndTime, props.language));
  }

  if (props.participantLimit !== null) {
    if (props.participantCount >= props.participantLimit) {
      strings.push(props.locales.waitinglist);
    } else {
      strings.push(
        `${props.participantCount}/${props.participantLimit} ${props.locales.seatsFree}`
      );
    }
  } else {
    strings.push(props.locales.unlimitedSeats);
  }

  return (
    <div className="text-neutral-700 font-semibold text-xs tracking-wide line-clamp-1">
      {strings.join(" | ")}
    </div>
  );
}

function ListItemFlag(props: {
  canceled: boolean;
  published: boolean;
  locales: { draft: string; canceled: string };
}) {
  const classes = classNames(
    "flex font-semibold items-center ml-auto border-r-8 pr-4 h-[123px] @sm:h-24 rounded-r-[7px]"
  );

  if (props.canceled) {
    return (
      <div
        className={classNames(classes, "border-negative-700 text-negative-700")}
      >
        {props.locales.canceled}
      </div>
    );
  }

  if (props.published === false) {
    return (
      <div
        className={classNames(classes, "border-primary-400 text-primary-400")}
      >
        {props.locales.draft}
      </div>
    );
  }
  return null;
}

function ListItemControl(props: {
  eventId: string;
  mode: "participating" | "waiting" | "canWait" | "canParticipate";
  locales: {
    participate: string;
    withdrawParticipation: string;
    joinWaitingList: string;
    leaveWaitingList: string;
  };
}) {
  let value;
  switch (props.mode) {
    case "canParticipate":
      value = "participate" as const;
      break;
    case "participating":
      value = "withdrawParticipation" as const;
      break;
    case "canWait":
      value = "joinWaitingList" as const;
      break;
    case "waiting":
      value = "leaveWaitingList" as const;
      break;
  }

  return (
    <>
      <Form
        method="post"
        preventScrollReset
        id={`event-control-form-${props.eventId}`}
      >
        <input type="hidden" name="eventId" defaultValue={props.eventId} />
      </Form>
      <Button
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
        }}
        variant={
          value === "participate" || value === "joinWaitingList"
            ? "normal"
            : "outline"
        }
        size="small"
        type="submit"
        name={INTENT_FIELD_NAME}
        value={value}
        fullSize
        form={`event-control-form-${props.eventId}`}
      >
        {props.locales[value]}
      </Button>
    </>
  );
}

function ListItemEventControls(props: { children: React.ReactNode }) {
  return <>{props.children}</>;
}

ListItemEvent.Controls = ListItemEventControls;
ListItemEvent.Control = ListItemControl;
ListItemEvent.Flag = ListItemFlag;
ListItemEvent.Image = Image;
ListItemEvent.Subline = ListItemSubline;
ListItemEvent.Headline = ListItemHeadline;
ListItemEvent.Info = ListItemInfo;

export default ListItemEvent;
