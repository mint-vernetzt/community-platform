import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { notFound, serverError } from "remix-utils";
import { z } from "zod";
import {
  createAdminAuthClient,
  createAuthClient,
  deleteUserByUid,
  getSessionUserOrThrow,
  signOut,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveProfileMode } from "../utils.server";
import {
  getProfileByUsername,
  getProfileWithAdministrations,
} from "./delete.server";
import { TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";

const i18nNS = ["routes/profile/settings/delete"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    confirmedToken: z
      .string()
      .regex(
        new RegExp(`/${t("validation.confirmed.regex")}/`),
        t("validation.confirmed.message")
      ),
  });
};

const environmentSchema = z.object({
  userId: z.string(),
});

export const loader = async ({ request, params }: DataFunctionArgs) => {
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/profile/settings/delete",
  ]);
  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: t("error.profileNotFound") });
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", t("error.notPrivileged"), {
    status: 403,
  });

  return json({}, { headers: response.headers });
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileWithAdministrations(environment.userId);
    if (profile === null) {
      throw t("error.notFound");
    }
    let lastAdminOrganizations: string[] = [];
    profile.administeredOrganizations.map((relation) => {
      if (relation.organization._count.admins === 1) {
        lastAdminOrganizations.push(relation.organization.name);
      }
      return null;
    });
    let lastAdminEvents: string[] = [];
    profile.administeredEvents.map((relation) => {
      if (relation.event._count.admins === 1) {
        lastAdminEvents.push(relation.event.name);
      }
      return null;
    });
    let lastAdminProjects: string[] = [];
    profile.administeredProjects.map((relation) => {
      if (relation.project._count.admins === 1) {
        lastAdminProjects.push(relation.project.name);
      }
      return null;
    });

    if (
      lastAdminOrganizations.length > 0 ||
      lastAdminEvents.length > 0 ||
      lastAdminProjects.length > 0
    ) {
      const errors: string[] = [];
      if (lastAdminOrganizations.length > 0) {
        errors.push(
          t("error.lastAdmin.organizations", {
            organizations: lastAdminOrganizations.join(", "),
          })
        );
      }
      if (lastAdminEvents.length > 0) {
        errors.push(
          t("error.lastAdmin.events", { events: lastAdminEvents.join(", ") })
        );
      }
      if (lastAdminProjects.length > 0) {
        errors.push(
          t("error.lastAdmin.projects", {
            events: lastAdminProjects.join(", "),
          })
        );
      }

      throw `${t("error.lastAdmin.intro")} ${errors.join(", ")} ${t(
        "error.lastAdmin.outro"
      )}`;
    }

    const adminAuthClient = createAdminAuthClient();

    const { error } = await deleteUserByUid(
      adminAuthClient,
      environment.userId
    );
    if (error !== null) {
      console.error(error.message);
      throw t("error.serverError");
    }
    return values;
  });
};

export const action = async ({ request, params }: DataFunctionArgs) => {
  const response = new Response();

  const t = await i18next.getFixedT(request, [
    "routes/profile/settings/delete",
  ]);
  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", t("error.notPrivileged"), {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
    environment: { userId: sessionUser.id },
  });
  if (result.success) {
    const { error } = await signOut(authClient);
    if (error !== null) {
      throw serverError({ message: error.message });
    }

    const cookie = response.headers.get("set-cookie");
    if (cookie !== null) {
      response.headers.set("set-cookie", cookie.replace("-code-verifier", ""));
    }

    return redirect("/goodbye", { headers: response.headers });
  }
  return json(result, { headers: response.headers });
};

export default function Index() {
  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>

      <h4 className="mb-4 font-semibold">{t("content.subline")}</h4>

      <p className="mb-8">{t("content.headline")}</p>

      <RemixForm method="post" schema={schema}>
        {({ Field, Button, Errors, register }) => (
          <>
            <Field name="confirmedToken" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="confirmedToken"
                    label={t("form.confirmed.label")}
                    placeholder={t("form.confirmed.placeholder")}
                    {...register("confirmedToken")}
                  />
                  <Errors />
                </>
              )}
            </Field>
            <button
              type="submit"
              className="btn btn-outline-primary ml-auto btn-small"
            >
              {t("form.submit.label")}
            </button>
            <Errors />
          </>
        )}
      </RemixForm>
    </>
  );
}
