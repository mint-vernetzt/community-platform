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

function ListItemEvent(props: {
  children: React.ReactNode;
  index: number;
  to?: string;
}) {
  const { children, index, to } = props;
  const { hideAfter } = useListContext();

  const classes = classNames(
    typeof hideAfter !== "undefined" && index > hideAfter - 1
      ? "hidden group-has-[:checked]:flex"
      : "flex",
    "gap-4 align-center border border-neutral-200 rounded-lg overflow-hidden"
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
    return isValidElement(child) && child.type === ListItemEvent.Control;
  });

  if (typeof to === "undefined") {
    return <div className={classes}>{children}</div>;
  }

  return (
    <Link
      to={to}
      className={classNames(
        classes,
        "focus:ring-2 focus:ring-primary-200 hover:bg-neutral-100 active:bg-primary-50"
      )}
      prefetch="intent"
    >
      <div className="hidden @xl:block w-36 shrink-0 aspect-[3/2]">
        <div className="w-36 h-full">{image}</div>
      </div>
      <div className="py-4 flex flex-col gap-1 max-w-[737px]">
        {info}
        {headline}
        {subline}
      </div>
      {flag}
      {control}
    </Link>
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

  strings.push(getDateDuration(startTime, endTime, props.language));
  if (isSameDay) {
    strings.push(getTimeDuration(startTime, endTime, props.language));
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
    <div className="text-neutral-700 font-semibold text-xs tracking-wide line-clamp-2">
      {strings.join(" | ")}
    </div>
  );
}

function ListItemFlag(props: { canceled: boolean; published: boolean }) {
  const classes = classNames(
    "flex font-semibold items-center ml-auto border-r-8 pr-4 py-6"
  );

  if (props.canceled) {
    return (
      <div
        className={classNames(classes, "border-negative-700 text-negative-700")}
      >
        Canceled
      </div>
    );
  }

  if (props.published === false) {
    return (
      <div
        className={classNames(classes, "border-primary-400 text-primary-400")}
      >
        Draft
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
    <Form
      method="post"
      preventScrollReset
      className="w-full flex justify-end items-center mr-6"
    >
      <input type="hidden" name="eventId" defaultValue={props.eventId} />
      <Button
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
        }}
        variant={
          value === "participate" || value === "joinWaitingList"
            ? "normal"
            : "outline"
        }
        type="submit"
        name={INTENT_FIELD_NAME}
        value={value}
      >
        {props.locales[value]}
      </Button>
    </Form>
  );
}

ListItemEvent.Control = ListItemControl;
ListItemEvent.Flag = ListItemFlag;
ListItemEvent.Image = Image;
ListItemEvent.Subline = ListItemSubline;
ListItemEvent.Headline = ListItemHeadline;
ListItemEvent.Info = ListItemInfo;

export default ListItemEvent;
