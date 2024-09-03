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

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    if (submission.value.intent === Request.Create) {
      const error = await createRequestToOrganization(
        submission.value.organizationId as string,
        sessionUser.id
      );
      if (error !== null) {
        throw new Error(t(error.message));
      }
    } else if (submission.value.intent === Request.Cancel) {
      console.log("canceling request");
      await cancelRequestToOrganization(
        submission.value.organizationId as string,
        sessionUser.id
      );
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

    return redirect(redirectURL.toString());
  }

  return json(submission);
}
