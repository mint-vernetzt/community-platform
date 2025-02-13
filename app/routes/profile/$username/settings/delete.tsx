import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
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
  type DeleteProfileLocales,
  getProfileByUsername,
  getProfileWithAdministrations,
} from "./delete.server";
import { detectLanguage } from "~/i18n.server";
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";
import { languageModuleMap } from "~/locales/.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { useLoaderData } from "@remix-run/react";

const createSchema = (locales: DeleteProfileLocales) => {
  return z.object({
    confirmedToken: z
      .string()
      .regex(
        new RegExp(locales.validation.confirmed.regex),
        locales.validation.confirmed.message
      ),
  });
};

const environmentSchema = z.object({
  userId: z.string(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/delete"];

  const profile = await getProfileByUsername(username);
  if (profile === null) {
    invariantResponse(false, locales.error.profileNotFound, { status: 404 });
  }
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.error.notPrivileged, {
    status: 403,
  });

  return { locales };
};

const createMutation = (locales: DeleteProfileLocales) => {
  return makeDomainFunction(
    createSchema(locales),
    environmentSchema
  )(async (values, environment) => {
    const profile = await getProfileWithAdministrations(environment.userId);
    if (profile === null) {
      throw locales.error.notFound;
    }
    const lastAdminOrganizations: string[] = [];
    profile.administeredOrganizations.map((relation) => {
      if (relation.organization._count.admins === 1) {
        lastAdminOrganizations.push(relation.organization.name);
      }
      return null;
    });
    const lastAdminEvents: string[] = [];
    profile.administeredEvents.map((relation) => {
      if (relation.event._count.admins === 1) {
        lastAdminEvents.push(relation.event.name);
      }
      return null;
    });
    const lastAdminProjects: string[] = [];
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
          insertParametersIntoLocale(locales.error.lastAdmin.organizations, {
            organizations: lastAdminOrganizations.join(", "),
          })
        );
      }
      if (lastAdminEvents.length > 0) {
        errors.push(
          insertParametersIntoLocale(locales.error.lastAdmin.events, {
            events: lastAdminEvents.join(", "),
          })
        );
      }
      if (lastAdminProjects.length > 0) {
        errors.push(
          insertParametersIntoLocale(locales.error.lastAdmin.projects, {
            projects: lastAdminProjects.join(", "),
          })
        );
      }

      throw `${locales.error.lastAdmin.intro} ${errors.join(", ")} ${
        locales.error.lastAdmin.outro
      }`;
    }

    return values;
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["profile/$username/settings/delete"];

  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", locales.error.notPrivileged, {
    status: 403,
  });

  const result = await performMutation({
    request,
    schema: createSchema(locales),
    mutation: createMutation(locales),
    environment: { userId: sessionUser.id },
  });
  if (result.success) {
    const { error, headers } = await signOut(request);
    if (error !== null) {
      console.error(error.message);
      invariantResponse(false, locales.error.serverError, { status: 500 });
    }

    const adminAuthClient = createAdminAuthClient();

    const result = await deleteUserByUid(adminAuthClient, sessionUser.id);
    if (result.error !== null) {
      console.error(result.error.message);
      throw locales.error.serverError;
    }

    return redirect("/goodbye", { headers });
  }
  return result;
};

export default function Index() {
  const { locales } = useLoaderData<typeof loader>();
  const schema = createSchema(locales);

  return (
    <>
      <h1 className="mb-8">{locales.content.headline}</h1>

      <h4 className="mb-4 font-semibold">{locales.content.subline}</h4>

      <p className="mb-8">{locales.content.headline}</p>

      <RemixFormsForm method="post" schema={schema}>
        {({ Field, Errors, register }) => (
          <>
            <Field name="confirmedToken" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="confirmedToken"
                    label={locales.form.confirmed.label}
                    placeholder={locales.form.confirmed.placeholder}
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
