import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "./types";

// TODO: fix type issue
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const transformParts = (parts: DateTimeRangeFormatPart[]): string => {
  const mapped = parts
    .map(
      // TODO: fix type issue
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (p: DateTimeRangeFormatPart): string => {
        if (["hour", "minute", "day", "month"].includes(p.type))
          return p.value.padStart(2, "0");
        if (p.type === "literal" && p.source === "shared") {
          if ([" at ", " um "].includes(p.value)) return " | ";
          if (p.value === ".–") return ". – ";
          if (["–", " – "].includes(p.value)) return " – ";
        }

        return p.value;
      }
    )
    .join("");

  return mapped
    .replace(/(.*)(\d{4})(, )(\d{2}:\d{2})(.*)/, "$1$2 | $4$5")
    .replace(/\u202F/g, "\u0020");
};

export const getDuration = (
  start: Date,
  end: Date,
  language: ArrayElement<typeof supportedCookieLanguages>
) => {
  const formatTimestamp: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  const formatDateLong: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  };

  const formatDateShort: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };

  const sameDay =
    start.toLocaleDateString(language, formatDateLong) ===
    end.toLocaleDateString(language, formatDateLong);
  // const onlySameYear = start.getFullYear() === end.getFullYear() && start.getMonth() !== end.getMonth();
  const onlySameYear = start.getMonth() !== end.getMonth();
  const format = sameDay
    ? formatTimestamp
    : onlySameYear
    ? formatDateShort
    : formatDateLong;
  const formatter = new Intl.DateTimeFormat(language, format);

  const formattedString = transformParts(
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    formatter.formatRangeToParts(start, end)
  );

  const result = formattedString
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .replaceAll(" a", " AM")
    .replaceAll(" p", " PM");

  return sameDay && !result.match(/^(.*)(Uhr|PM|AM)$/)
    ? `${result} Uhr`
    : result;
};

export function getDateDuration(
  startTime: Date,
  endTime: Date,
  language: ArrayElement<typeof supportedCookieLanguages>
) {
  const formatLong: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "2-digit",
  };
  const formatShort: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };

  const sameYear = startTime.getFullYear() === endTime.getFullYear();
  const sameMonth = startTime.getMonth() === endTime.getMonth();

  const format = sameMonth && sameYear ? formatLong : formatShort;
  const formatter = new Intl.DateTimeFormat(language, format);

  // TODO: fix type issue
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return transformParts(formatter.formatRangeToParts(startTime, endTime));
}

export function getFormattedDate(
  date: Date,
  language: ArrayElement<typeof supportedCookieLanguages>
) {
  return date.toLocaleDateString(language, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export function getTimeDuration(
  startTime: Date,
  endTime: Date,
  language: ArrayElement<typeof supportedCookieLanguages>
) {
  const format: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat(language, format);
  const result = formatter
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .formatRange(startTime, endTime)
    .replaceAll(" a", " AM")
    .replaceAll(" p", " PM")
    .replaceAll("–", "-")
    .replaceAll(" - ", " - ")
    .replaceAll(/\u202F/g, " ");

  return result.match(/^(.*)(Uhr|PM|AM)$/) ? result : `${result} Uhr`;
}
