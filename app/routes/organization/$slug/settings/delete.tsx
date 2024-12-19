import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
import { z } from "zod";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { deriveOrganizationMode } from "../utils.server";
import {
  deleteOrganizationBySlug,
  type DeleteOrganizationLocales,
  getProfileByUserId,
} from "./delete.server";
import { languageModuleMap } from "~/locales/.server";
import { useLoaderData } from "@remix-run/react";

const createSchema = (locales: DeleteOrganizationLocales) => {
  return z.object({
    confirmedToken: z
      .string()
      .regex(
        new RegExp(locales.validation.confirmedToken.regex),
        locales.validation.confirmedToken.message
      ),
  });
};

const environmentSchema = z.object({
  slug: z.string(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/delete"];

  const { authClient } = createAuthClient(request);

  const slug = getParamValueOrThrow(params, "slug");

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notFound, { status: 403 });

  return { locales };
};

const createMutation = (locales: DeleteOrganizationLocales) => {
  return makeDomainFunction(
    createSchema(locales),
    environmentSchema
  )(async (values, environment) => {
    try {
      await deleteOrganizationBySlug(environment.slug);
    } catch {
      throw locales.error.serverError;
    }
    return values;
  });
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/delete"];
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  invariantResponse(mode === "admin", locales.error.notPrivileged, {
    status: 403,
  });
  const profile = await getProfileByUserId(sessionUser.id);
  invariantResponse(profile, locales.error.notFound, { status: 404 });

  const result = await performMutation({
    request,
    schema: createSchema(locales),
    mutation: createMutation(locales),
    environment: {
      slug: slug,
    },
  });

  if (result.success) {
    return redirect(`/profile/${profile.username}`);
  }

  return result;
};

export default function Delete() {
  const { locales } = useLoaderData<typeof loader>();
  const schema = createSchema(locales);

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>

      <p className="mb-4 font-semibold">{locales.content.intro}</p>

      <p className="mb-8">{locales.content.confirmation}</p>

      <RemixFormsForm method="post" schema={schema}>
        {({ Field, Button, Errors, register }) => (
          <>
            <Field name="confirmedToken" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="confirmedToken"
                    label={locales.form.confirmedToken.label}
                    placeholder={locales.form.confirmedToken.placeholder}
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
              {locales.form.submit.label}
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
    </>
  );
}
