import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveOrganizationMode } from "../utils.server";
import { deleteOrganizationBySlug, getProfileByUserId } from "./delete.server";

const i18nNS = ["routes/organization/settings/delete"] as const;
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    confirmedToken: z
      .string()
      .regex(
        new RegExp(t("validation.confirmedToken.regex")),
        t("validation.confirmedToken.message")
      ),
  });
};

const environmentSchema = z.object({
  slug: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/delete",
  ]);

  const { authClient } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notFound"), { status: 403 });

  return null;
};

const createMutation = (t: TFunction) => {
  return makeDomainFunction(
    createSchema(t),
    environmentSchema
  )(async (values, environment) => {
    try {
      await deleteOrganizationBySlug(environment.slug);
    } catch {
      throw t("error.serverError");
    }
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, [
    "routes/organization/settings/delete",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notPrivileged"), {
    status: 403,
  });
  const profile = await getProfileByUserId(sessionUser.id);
  invariantResponse(profile, t("error.ProfileNotFound"), { status: 404 });

  const result = await performMutation({
    request,
    schema: createSchema(t),
    mutation: createMutation(t),
    environment: {
      slug: slug,
    },
  });

  if (result.success) {
    return redirect(`/profile/${profile.username}`);
  }

  return json(result);
};

export default function Delete() {
  const { t } = useTranslation(i18nNS);
  const schema = createSchema(t);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>

      <p className="mb-4 font-semibold">{t("content.intro")}</p>

      <p className="mb-8">{t("content.confirmation")}</p>

      <RemixFormsForm method="post" schema={schema}>
        {({ Field, Button, Errors, register }) => (
          <>
            <Field name="confirmedToken" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="confirmedToken"
                    label={t("form.confirmedToken.label")}
                    placeholder={t("form.confirmedToken.placeholder")}
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
