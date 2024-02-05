import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { fileUploadSchema } from "~/lib/utils/schemas";
import { deriveEventMode } from "../event/utils.server";
import { deriveOrganizationMode } from "../organization/$slug/utils.server";
import { deriveProfileMode } from "../profile/$username/utils.server";
import { deriveProjectMode } from "../project/utils.server";
import {
  removeImageFromEvent,
  removeImageFromOrganization,
  removeImageFromProfile,
  removeImageFromProject,
} from "./delete.server";
import { deriveOrganizationMode } from "../organization/$slug/utils.server";
import { invariantResponse } from "~/lib/utils/response";
import { deriveEventMode } from "../event/utils.server";
import { deriveProjectMode } from "../project/utils.server";
import { deriveProfileMode } from "../profile/$username/utils.server";
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/upload/delete"];
export const handle = {
  i18n: i18nNS,
};

const environment = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    fileUploadSchema,
    environment
  )(async (values, environment) => {
    const { subject, slug, uploadKey } = values;

    let success = true;
    // TODO: fix type issue
    // @ts-ignore
    const sessionUser = await getSessionUserOrThrow(environment.authClient);

    try {
      if (subject === "user") {
        const username = slug;
        const mode = await deriveProfileMode(sessionUser, username);
        invariantResponse(mode === "owner", t("error.notPrivileged"), {
          status: 403,
        });
        await removeImageFromProfile(sessionUser.id, uploadKey);
      }

      if (subject === "organization") {
        const mode = await deriveOrganizationMode(sessionUser, slug);
        invariantResponse(mode === "admin", t("error.notPrivileged"), {
          status: 403,
        });
        await removeImageFromOrganization(slug, uploadKey);
      }

      if (subject === "event") {
        const mode = await deriveEventMode(sessionUser, slug);
        invariantResponse(mode === "admin", t("error.notPrivileged"), {
          status: 403,
        });
        await removeImageFromEvent(slug, uploadKey);
      }

      if (subject === "project") {
        const mode = await deriveProjectMode(sessionUser, slug);
        invariantResponse(mode === "admin", t("error.notPrivileged"), {
          status: 403,
        });
        await removeImageFromProject(slug, uploadKey);
      }
    } catch (e) {
      success = false;
    }

    return { success };
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);
  const formData = await request.clone().formData();
  const redirectUrl = formData.get("redirect")?.toString();

  const result = await performMutation({
    request,
    schema: fileUploadSchema,
    mutation: createMutation(t),
    environment: {
      authClient: authClient,
    },
  });

  if (result.success && redirectUrl !== undefined) {
    return redirect(redirectUrl);
  }

  return json(result);
};
