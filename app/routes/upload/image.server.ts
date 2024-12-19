import type { User } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "../event/utils.server";
import { deriveOrganizationMode } from "../organization/$slug/utils.server";
import { deriveProfileMode } from "../profile/$username/utils.server";
import { deriveProjectMode } from "../project/utils.server";
import { type Subject } from "./utils.server";

export type UploadImageLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["upload/image"];

export async function handleAuth(
  subject: Subject,
  slug: string,
  sessionUser: User,
  locales: UploadImageLocales
) {
  if (subject === "user") {
    const username = slug;
    const mode = await deriveProfileMode(sessionUser, username);
    invariantResponse(mode === "owner", locales.error.notPrivileged, {
      status: 403,
    });
  }
  if (subject === "organization") {
    const mode = await deriveOrganizationMode(sessionUser, slug);
    invariantResponse(mode === "admin", locales.error.notPrivileged, {
      status: 403,
    });
  }
  if (subject === "event") {
    const mode = await deriveEventMode(sessionUser, slug);
    invariantResponse(mode === "admin", locales.error.notPrivileged, {
      status: 403,
    });
  }
  if (subject === "project") {
    const mode = await deriveProjectMode(sessionUser, slug);
    invariantResponse(mode === "admin", locales.error.notPrivileged, {
      status: 403,
    });
  }
}
