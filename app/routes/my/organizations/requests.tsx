import { type ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { detectLanguage } from "~/root.server";
import { i18nNS } from "../organizations";
import { GetOrganizationsToAdd } from "./get-organizations-to-add";
import {
  acceptRequestFromProfile,
  cancelRequestToOrganization,
  createRequestToOrganization,
  rejectRequestFromProfile,
} from "./requests.server";
import { redirectWithToast } from "~/toast.server";
import { parseWithZod } from "@conform-to/zod-v1";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { invariantResponse } from "~/lib/utils/response";

export const AddToOrganizationRequest: {
  Create: "createRequest";
  Cancel: "cancelRequest";
  Reject: "rejectRequest";
  Accept: "acceptRequest";
} = {
  Create: "createRequest",
  Cancel: "cancelRequest",
  Reject: "rejectRequest",
  Accept: "acceptRequest",
};

export const schema = z.object({
  organizationId: z.string(),
  profileId: z.string().optional(),
  [GetOrganizationsToAdd.SearchParam]: z.string().optional(),
  intent: z
    .string()
    .refine(
      (intent) =>
        intent === AddToOrganizationRequest.Create ||
        intent === AddToOrganizationRequest.Cancel ||
        intent === AddToOrganizationRequest.Reject ||
        intent === AddToOrganizationRequest.Accept,
      {
        message: `Only ${AddToOrganizationRequest.Create}, ${AddToOrganizationRequest.Cancel}, ${AddToOrganizationRequest.Reject} and ${AddToOrganizationRequest.Accept} are valid intents.`,
      }
    ),
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
  const submission = parseWithZod(formData, { schema: schema });
  if (submission.status !== "success") {
    return json(submission.reply());
  }

  let organization;
  let profile;

  if (submission.value.intent === AddToOrganizationRequest.Create) {
    const result = await createRequestToOrganization(
      submission.value.organizationId,
      sessionUser.id
    );
    if (typeof result.error !== "undefined") {
      throw new Error(t(result.error.message));
    }
    organization = result.organization;
  } else if (submission.value.intent === AddToOrganizationRequest.Cancel) {
    const result = await cancelRequestToOrganization(
      submission.value.organizationId,
      sessionUser.id
    );
    organization = result.organization;
  } else {
    const organizationSlug = undefined;
    const organizationMode = await deriveOrganizationMode(
      sessionUser,
      organizationSlug,
      submission.value.organizationId
    );
    invariantResponse(
      organizationMode === "admin",
      "Only admins can accept or reject requests.",
      { status: 403 }
    );
    const profileId = submission.value.profileId;
    invariantResponse(
      profileId !== undefined,
      "Profile ID is required to accept or reject requests.",
      { status: 400 }
    );
    let result;
    if (submission.value.intent === AddToOrganizationRequest.Reject) {
      result = await rejectRequestFromProfile(
        submission.value.organizationId,
        profileId
      );
    } else {
      result = await acceptRequestFromProfile(
        submission.value.organizationId,
        profileId
      );
    }
    profile = result.profile;
  }

  const redirectURL = new URL(
    `${process.env.COMMUNITY_BASE_URL}/my/organizations`
  );
  if (typeof submission.value[GetOrganizationsToAdd.SearchParam] === "string") {
    redirectURL.searchParams.set(
      GetOrganizationsToAdd.SearchParam,
      submission.value[GetOrganizationsToAdd.SearchParam] as string
    );
  }

  return redirectWithToast(redirectURL.toString(), {
    key: `${submission.value.intent}-${Date.now()}`,
    level:
      submission.value.intent === AddToOrganizationRequest.Create ||
      submission.value.intent === AddToOrganizationRequest.Accept
        ? "positive"
        : "negative",
    message:
      submission.value.intent === AddToOrganizationRequest.Create ||
      submission.value.intent === AddToOrganizationRequest.Cancel
        ? t(`requests.${submission.value.intent}`, {
            organization,
          })
        : t(`requests.${submission.value.intent}`, {
            academicTitle: profile?.academicTitle
              ? `${profile.academicTitle} `
              : "",
            firstName: profile?.firstName,
            lastName: profile?.lastName,
          }),
  });
}
