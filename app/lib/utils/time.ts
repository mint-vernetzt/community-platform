// @ts-ignore
const transformParts = (parts: DateTimeRangeFormatPart[]): string => {
  const mapped = parts
    .map(
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

  return mapped.replace(/(.*)(\d{4})(, )(\d{2}:\d{2})(.*)/, "$1$2 | $4$5");
};

export const getDuration = (start: Date, end: Date, language: string) => {
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

  // @ts-ignore
  const result = transformParts(formatter.formatRangeToParts(start, end));

  return sameDay && !result.match(/^(.*)(Uhr|PM|AM)$/)
    ? `${result} Uhr`
    : result;
};

export function getDurationOLD(
  startTime: Date,
  endTime: Date,
  language: string
) {
  let duration: string;

  const formattedStartDate = startTime.toLocaleDateString(language, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const formattedEndDate = endTime.toLocaleDateString(language, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const sameYear = startTime.getFullYear() === endTime.getFullYear();
  const sameMonth = sameYear && startTime.getMonth() === endTime.getMonth();
  const sameDay = formattedStartDate === formattedEndDate;
  const sameTime = startTime.getTime() === endTime.getTime();

  if (sameTime) {
    // 01. Januar 2022 | 12:00 Uhr
    duration = `${startTime.toLocaleDateString(language, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })} | ${startTime.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
    })} Uhr`;
  } else if (sameDay) {
    // 01. Januar 2022 | 12:00 - 14:00 Uhr
    duration = `${startTime.toLocaleDateString(language, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })} | ${startTime.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
    })} – ${endTime.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
    })} Uhr`;
  } else if (sameMonth) {
    // 01. - 02. Januar 2022
    duration = `${startTime.toLocaleDateString(language, {
      day: "2-digit",
    })}. – ${endTime.toLocaleDateString(language, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })}`;
  } else if (sameYear) {
    // 01. Jan - 02. Feb 2022
    duration = `${startTime.toLocaleDateString(language, {
      day: "2-digit",
      month: "short",
    })} – ${formattedEndDate}`;
  } else {
    // 01. Jan 2022 - 02. Feb 2023
    duration = `${formattedStartDate} - ${formattedEndDate}`;
  }

  return duration;
}

export function getDateDuration(
  startTime: Date,
  endTime: Date,
  language: string
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

  // @ts-ignore
  return transformParts(formatter.formatRangeToParts(startTime, endTime));
}

export function getFormattedDate(date: Date, language: string) {
  return date.toLocaleDateString(language, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export function getTimeDuration(
  startTime: Date,
  endTime: Date,
  language: string
) {
  const format: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat(language, format);
  const result = formatter
    // @ts-ignore
    .formatRange(startTime, endTime)
    .replaceAll(" ", "")
    .replaceAll("–", " - ");
  return result.match(/^(.*)(Uhr|PM|AM)$/) ? result : `${result} Uhr`;
}
