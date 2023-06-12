import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { Form as RemixForm, performMutation } from "remix-forms";
import { notFound, serverError } from "remix-utils";
import type { Schema } from "zod";
import { z } from "zod";
import {
  createAuthClient,
  deleteUserByUid,
  getSessionUserOrThrow,
  signOut,
} from "~/auth.server";
import Input from "~/components/FormElements/Input/Input";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  getRelationsOnProfileByUserId,
  getProfileByUsername,
} from "~/profile.server";
import { checkIdentityOrThrow, handleAuthorization } from "../utils.server";

const schema = z.object({
  userId: z.string().uuid(),
  confirmedToken: z
    .string()
    .regex(/wirklich löschen/, 'Bitte "wirklich löschen" eingeben.'),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

type LoaderData = {
  profile: NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: "profile not found." });
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  await handleAuthorization(sessionUser.id, profile.id);

  return json<LoaderData>({ profile }, { headers: response.headers });
};

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  const profile = await getRelationsOnProfileByUserId(values.userId);
  if (profile === null) {
    throw "Das Profil konnte nicht gefunden werden.";
  }
  profile.memberOf.some(({ organization, isPrivileged }) => {
    const organizationHasOtherPrivilegedMembers = organization.teamMembers.some(
      (teamMember) => {
        return (
          teamMember.profileId !== values.userId && teamMember.isPrivileged
        );
      }
    );
    if (isPrivileged && !organizationHasOtherPrivilegedMembers) {
      throw `Das Profil ist letzter Administrator in der Organisation "${organization.name}" und kann deshalb nicht gelöscht werden. Bitte übertrage die Rechte auf eine andere Person oder lösche zuerst deine Organisation.`;
    }
    return false;
  });
  profile.teamMemberOfEvents.some(({ event, isPrivileged }) => {
    const eventHasOtherPrivilegedMembers = event.teamMembers.some(
      (teamMember) => {
        return (
          teamMember.profileId !== values.userId && teamMember.isPrivileged
        );
      }
    );
    if (isPrivileged && !eventHasOtherPrivilegedMembers) {
      throw `Das Profil ist letzter Administrator in der Veranstaltung "${event.name}" und kann deshalb nicht gelöscht werden. Bitte übertrage die Rechte auf eine andere Person oder lösche zuerst deine Veranstaltung.`;
    }
    return false;
  });
  profile.teamMemberOfProjects.some(({ project, isPrivileged }) => {
    const projectHasOtherPrivilegedMembers = project.teamMembers.some(
      (teamMember) => {
        return (
          teamMember.profileId !== values.userId && teamMember.isPrivileged
        );
      }
    );
    if (isPrivileged && !projectHasOtherPrivilegedMembers) {
      throw `Das Profil ist letzter Administrator in dem Projekt "${project.name}" und kann deshalb nicht gelöscht werden. Bitte übertrage die Rechte auf eine andere Person oder lösche zuerst dein Projekt.`;
    }
    return false;
  });
  try {
    await deleteUserByUid(environment.authClient, values.userId);
  } catch {
    throw "Das Profil konnte nicht gelöscht werden.";
  }
  return values;
});

type ActionData = PerformMutation<z.infer<Schema>, z.infer<typeof schema>>;

export const action: ActionFunction = async ({ request, params }) => {
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const username = getParamValueOrThrow(params, "username");
  const profile = await getProfileByUsername(username);
  if (profile === null) {
    throw notFound({ message: "profile not found." });
  }
  const sessionUser = await getSessionUserOrThrow(authClient);
  await handleAuthorization(sessionUser.id, profile.id);
  await checkIdentityOrThrow(request, sessionUser);

  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient },
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
  return json<ActionData>(result, { headers: response.headers });
};

export default function Index() {
  const { profile } = useLoaderData<LoaderData>();

  return (
    <>
      <h1 className="mb-8">Profil löschen</h1>

      <h4 className="mb-4 font-semibold">Schade, dass Du gehst.</h4>

      <p className="mb-8">
        Bitte gib "wirklich löschen" ein, um das Löschen zu bestätigen. Wenn Du
        danach auf “Profil endgültig löschen” klickst, wird Dein Profil ohne
        erneute Abfrage gelöscht.
      </p>

      <RemixForm method="post" schema={schema}>
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
            <Field name="userId">
              {({ Errors }) => (
                <>
                  <input
                    type="hidden"
                    value={profile.id}
                    {...register("userId")}
                  ></input>
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
      </RemixForm>
    </>
  );
}
