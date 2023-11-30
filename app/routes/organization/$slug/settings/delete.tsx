import type { DataFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "remix-domains";
import { Form as RemixForm, performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { deriveOrganizationMode } from "../utils.server";
import { deleteOrganizationBySlug, getProfileByUserId } from "./delete.server";
import i18next from "~/i18next.server";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

export const handle = {
  i18n: ["routes/organization/settings/delete"],
};

const createSchema = (t: TFunction) => {
  return z.object({
    confirmedToken: z
      .string()
      .regex(
        new RegExp(t("validation.confirmedToken.regexp")),
        t("validation.confirmedToken.message")
      ),
  });
};

const environmentSchema = z.object({
  slug: z.string(),
});

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/organization/settings/delete",
  ]);

  const authClient = createAuthClient(request, response);

  const slug = getParamValueOrThrow(params, "slug");

  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", t("error.notFound"), { status: 403 });

  return response;
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

export const action = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();
  const t = await i18next.getFixedT(request, [
    "routes/organization/settings/delete",
  ]);
  const slug = getParamValueOrThrow(params, "slug");
  const authClient = createAuthClient(request, response);
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
    return redirect(`/profile/${profile.username}`, {
      headers: response.headers,
    });
  }

  return json(result, { headers: response.headers });
};

export default function Delete() {
  const { t } = useTranslation(["routes/organization/settings/delete"]);
  const schema = createSchema(t);

  return (
    <>
      <h1 className="mb-8">{t("content.headline")}</h1>

      <p className="mb-4 font-semibold">{t("content.intro")}</p>

      <p className="mb-8">{t("content.confirmation")}</p>

      <RemixForm method="post" schema={schema}>
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
      </RemixForm>
    </>
  );
}
