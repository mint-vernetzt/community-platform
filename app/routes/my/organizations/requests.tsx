import { parse } from "@conform-to/zod";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";
import { i18nNS } from "../organizations";
import { GetOrganizationsToAdd } from "./get-organizations-to-add";
import {
  cancelRequestToOrganization,
  createRequestToOrganization,
} from "./requests.server";
import { redirectWithToast } from "~/toast.server";

export const Request = {
  Create: "createRequest",
  Cancel: "cancelRequest",
};

export const schema = z.object({
  organizationId: z.string(),
  [GetOrganizationsToAdd.SearchParam]: z.string().optional(),
  intent: z.enum([Request.Create, Request.Cancel]),
});

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirect("/login?login_redirect=/my/organizations");
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });

  let organization: { name: string } | null = null;

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    if (submission.value.intent === Request.Create) {
      const result = await createRequestToOrganization(
        submission.value.organizationId as string,
        sessionUser.id
      );
      if (typeof result.error !== "undefined") {
        throw new Error(t(result.error.message));
      }
      organization = result.organization;
    } else if (submission.value.intent === Request.Cancel) {
      const result = await cancelRequestToOrganization(
        submission.value.organizationId as string,
        sessionUser.id
      );
      organization = result.organization;
    }

    const redirectURL = new URL(
      `${process.env.COMMUNITY_BASE_URL}/my/organizations`
    );
    if (
      typeof submission.value[GetOrganizationsToAdd.SearchParam] === "string"
    ) {
      redirectURL.searchParams.set(
        GetOrganizationsToAdd.SearchParam,
        submission.value[GetOrganizationsToAdd.SearchParam] as string
      );
    }

    return redirectWithToast(redirectURL.toString(), {
      key: `${submission.value.intent}-${Date.now()}`,
      level:
        submission.value.intent === Request.Create ? "positive" : "negative",
      message: t(`requests.${submission.value.intent}`, {
        organization,
      }),
    });
  }

  return json(submission);
}
