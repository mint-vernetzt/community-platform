import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { fileUploadSchema } from "~/lib/utils/schemas";
import { detectLanguage } from "~/i18n.server";
import { deriveEventMode } from "../event/utils.server";
import { deriveOrganizationMode } from "../organization/$slug/utils.server";
import { deriveProfileMode } from "../profile/$username/utils.server";
import { deriveProjectMode } from "../project/utils.server";
import {
  type DeleteImageLocales,
  removeImageFromEvent,
  removeImageFromOrganization,
  removeImageFromProfile,
  removeImageFromProject,
} from "./delete.server";
import { languageModuleMap } from "~/locales/.server";

const environment = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

const createMutation = (locales: DeleteImageLocales) => {
  return makeDomainFunction(
    fileUploadSchema,
    environment
  )(async (values, environment) => {
    const { subject, slug, uploadKey } = values;

    let success = true;
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const sessionUser = await getSessionUserOrThrow(environment.authClient);

    try {
      if (subject === "user") {
        const username = slug;
        const mode = await deriveProfileMode(sessionUser, username);
        invariantResponse(mode === "owner", locales.error.notPrivileged, {
          status: 403,
        });
        await removeImageFromProfile(sessionUser.id, uploadKey);
      }

      if (subject === "organization") {
        const mode = await deriveOrganizationMode(sessionUser, slug);
        invariantResponse(mode === "admin", locales.error.notPrivileged, {
          status: 403,
        });
        await removeImageFromOrganization(slug, uploadKey);
      }

      if (subject === "event") {
        const mode = await deriveEventMode(sessionUser, slug);
        invariantResponse(mode === "admin", locales.error.notPrivileged, {
          status: 403,
        });
        await removeImageFromEvent(slug, uploadKey);
      }

      if (subject === "project") {
        const mode = await deriveProjectMode(sessionUser, slug);
        invariantResponse(mode === "admin", locales.error.notPrivileged, {
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
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["upload/delete"];
  const formData = await request.clone().formData();
  const redirectUrl = formData.get("redirect")?.toString();

  const result = await performMutation({
    request,
    schema: fileUploadSchema,
    mutation: createMutation(locales),
    environment: {
      authClient: authClient,
    },
  });

  if (result.success && redirectUrl !== undefined) {
    return redirect(redirectUrl);
  }

  return result;
};
