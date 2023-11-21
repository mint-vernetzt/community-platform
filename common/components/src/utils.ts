import { TFunction } from "i18next";

export function getFullName(
  data: { academicTitle?: string | null; firstName: string; lastName: string },
  options: { withAcademicTitle: boolean } = { withAcademicTitle: true }
) {
  const { firstName, lastName, academicTitle } = data;

  if (typeof academicTitle === "string" && options.withAcademicTitle === true) {
    return `${academicTitle} ${firstName} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}

export function getInitials(
  options: { firstName: string; lastName: string } | { name: string }
) {
  if ("name" in options) {
    const splittedName = options.name.split(" ", 2);
    const initials = `${splittedName[0].charAt(0)}${
      splittedName[1]?.charAt(0) || ""
    }`.toUpperCase();
    return initials;
  }

  const { firstName, lastName } = options;
  return firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : "";
}

export function getDateDuration(
  startTime: Date,
  endTime: Date,
  locale: string
) {
  let duration: string;
  const formattedStartDate = startTime.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const formattedEndDate = endTime.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const sameYear = startTime.getFullYear() === endTime.getFullYear();
  const sameMonth = sameYear && startTime.getMonth() === endTime.getMonth();
  const sameDay = formattedStartDate === formattedEndDate;

  if (sameDay) {
    duration = startTime.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  } else if (sameMonth) {
    // 01. - 02. Januar 2022
    duration = `${startTime.toLocaleDateString(locale, {
      day: "2-digit",
    })}. - ${endTime.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })}`;
  } else if (sameYear) {
    // 01. Jan - 02. Feb 2022
    duration = `${startTime.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
    })} – ${formattedEndDate}`;
  } else {
    // 01. Jan 2022 - 02. Feb 2023
    duration = `${formattedStartDate} - ${formattedEndDate}`;
  }
  return duration;
}

export function getTimeDuration(
  startTime: Date,
  endTime: Date,
  locale: string,
  t: TFunction
) {
  const sameTime = startTime.getTime() === endTime.getTime();
  if (sameTime) {
    return t("timeDuration.same", {
      ns: "utils/utils",
      time: startTime.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }

  return t("timeDuration.different", {
    ns: "utils/utils",
    from: startTime.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    until: endTime.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}
