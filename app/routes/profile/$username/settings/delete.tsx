import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAdminAuthClient,
  createAuthClient,
  deleteUserByUid,
  getSessionUserOrRedirectPathToLogin,
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
import { type TFunction } from "i18next";
import i18next from "~/i18next.server";
import { useTranslation } from "react-i18next";
import { detectLanguage } from "~/root.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const i18nNS = ["routes/profile/settings/delete"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    confirmedToken: z
      .string()
      .regex(
        new RegExp(t("validation.confirmed.regex")),
        t("validation.confirmed.message")
      ),
  });
};

const environmentSchema = z.object({
  userId: z.string(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes/profile/settings/delete"]);

  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw json({ message: t("error.profileNotFound") }, { status: 404 });
  }
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", t("error.notPrivileged"), {
    status: 403,
  });

  return null;
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

    return values;
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes/profile/settings/delete"]);

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
    const { error, headers } = await signOut(request);
    if (error !== null) {
      throw json({ message: error.message }, { status: 500 });
    }

    const adminAuthClient = createAdminAuthClient();

    const result = await deleteUserByUid(adminAuthClient, sessionUser.id);
    if (result.error !== null) {
      console.error(result.error.message);
      throw t("error.serverError");
    }

    return redirect("/goodbye", { headers });
  }
  return json(result);
};

export default function Index() {
  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>

      <h4 className="mb-4 font-semibold">{t("content.subline")}</h4>

      <p className="mb-8">{t("content.headline")}</p>

      <RemixFormsForm method="post" schema={schema}>
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
      </RemixFormsForm>
    </>
  );
}
