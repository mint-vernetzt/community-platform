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

export function getDateDuration(startTime: Date, endTime: Date) {
  let duration: string;
  const formattedStartDate = startTime.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const formattedEndDate = endTime.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const sameYear = startTime.getFullYear() === endTime.getFullYear();
  const sameMonth = sameYear && startTime.getMonth() === endTime.getMonth();
  const sameDay = formattedStartDate === formattedEndDate;

  if (sameDay) {
    duration = startTime.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  } else if (sameMonth) {
    // 01. - 02. Januar 2022
    duration = `${startTime.toLocaleDateString("de-DE", {
      day: "2-digit",
    })}. - ${endTime.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })}`;
  } else if (sameYear) {
    // 01. Jan - 02. Feb 2022
    duration = `${startTime.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
    })} – ${formattedEndDate}`;
  } else {
    // 01. Jan 2022 - 02. Feb 2023
    duration = `${formattedStartDate} – ${formattedEndDate}`;
  }
  return duration;
}

export function getTimeDuration(startTime: Date, endTime: Date) {
  const sameTime = startTime.getTime() === endTime.getTime();
  let result: string;
  if (sameTime) {
    result = `${startTime.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })} Uhr`;
  } else {
    result = `${startTime.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${endTime.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })} Uhr`;
  }
  return result;
}
