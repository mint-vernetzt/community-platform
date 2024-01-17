import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { makeDomainFunction } from "domain-functions";
import { performMutation } from "remix-forms";
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
import { RemixFormsForm } from "~/components/RemixFormsForm/RemixFormsForm";

const schema = z.object({
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

const environmentSchema = z.object({
  userId: z.string(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { authClient, response } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw json({ message: "profile not found." }, { status: 404 });
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  return json({}, { headers: response.headers });
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const profile = await getProfileWithAdministrations(environment.userId);
  if (profile === null) {
    throw "Das Profil konnte nicht gefunden werden";
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
    throw `Das Profil ist letzter Administrator in${
      lastAdminOrganizations.length > 0
        ? ` den Organisationen: ${lastAdminOrganizations.join(", ")},`
        : ""
    }${
      lastAdminEvents.length > 0
        ? ` den Veranstaltungen: ${lastAdminEvents.join(", ")},`
        : ""
    }${
      lastAdminProjects.length > 0
        ? ` den Projekten: ${lastAdminProjects.join(", ")},`
        : ""
    } weshalb es nicht gelöscht werden kann. Bitte übertrage die Rechte auf eine andere Person oder lösche zuerst diese Organisationen, Veranstaltungen oder Projekte.`;
  }

  const adminAuthClient = createAdminAuthClient();

  const { error } = await deleteUserByUid(adminAuthClient, environment.userId);
  if (error !== null) {
    console.error(error.message);
    throw "Das Profil konnte nicht gelöscht werden.";
  }
  return values;
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { authClient, response } = createAuthClient(request);
  const username = getParamValueOrThrow(params, "username");
  const sessionUser = await getSessionUserOrThrow(authClient);
  const mode = await deriveProfileMode(sessionUser, username);
  invariantResponse(mode === "owner", "Not privileged", { status: 403 });

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { userId: sessionUser.id },
  });
  if (result.success) {
    const { error } = await signOut(authClient);
    if (error !== null) {
      throw json({ message: error.message }, { status: 500 });
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
  return (
    <>
      <h1 className="mb-8">Profil löschen</h1>

      <h4 className="mb-4 font-semibold">Schade, dass Du gehst.</h4>

      <p className="mb-8">
        Bitte gib "wirklich löschen" ein, um das Löschen zu bestätigen. Wenn Du
        danach auf “Profil endgültig löschen” klickst, wird Dein Profil ohne
        erneute Abfrage gelöscht.
      </p>

      <RemixFormsForm method="post" schema={schema}>
        {({ Field, Button, Errors, register }) => (
          <>
            <Field name="confirmedToken" className="mb-4">
              {({ Errors }) => (
                <>
                  <Input
                    id="confirmedToken"
                    label="Löschung bestätigen"
                    placeholder="wirklich löschen"
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
              Profil endgültig löschen
            </button>
            <Errors />
          </>
        )}
      </RemixFormsForm>
    </>
  );
}
