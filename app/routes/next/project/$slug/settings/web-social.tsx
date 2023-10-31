import { redirect, type DataFunctionArgs, json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { BackButton } from "./__components";
import { getRedirectPathOnProtectedProjectRoute } from "./utils.server";
import { z } from "zod";
import {
  blueSkySchema,
  facebookSchema,
  instagramSchema,
  linkedinSchema,
  mastodonSchema,
  twitterSchema,
  websiteSchema,
  xingSchema,
  youtubeSchema,
} from "~/lib/utils/schemas";
import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { redirectWithAlert } from "~/alert.server";
import { prismaClient } from "~/prisma.server";

const webSocialSchema = z.object({
  website: websiteSchema,
  facebook: facebookSchema,
  linkedin: linkedinSchema,
  xing: xingSchema,
  twitter: twitterSchema,
  mastodon: mastodonSchema,
  blueSky: blueSkySchema,
  instagram: instagramSchema,
  youtube: youtubeSchema,
});

export const loader = async (args: DataFunctionArgs) => {
  const { request, params } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }

  const project = await prismaClient.project.findUnique({
    select: {
      website: true,
      facebook: true,
      linkedin: true,
      xing: true,
      twitter: true,
      mastodon: true,
      blueSky: true,
      instagram: true,
      youtube: true,
    },
    where: {
      slug: params.slug,
    },
  });
  invariantResponse(project !== null, "Project not found", {
    status: 404,
  });

  return json({ project });
};

export async function action({ request, params }: DataFunctionArgs) {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);
  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });
  const redirectPath = await getRedirectPathOnProtectedProjectRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath, { headers: response.headers });
  }
  // Validation
  const formData = await request.formData();
  const submission = await parse(formData, {
    schema: (intent) =>
      webSocialSchema.transform(async (data, ctx) => {
        if (intent !== "submit") return { ...data };
        try {
          // TODO: Investigate why typescript does not show an type error...
          // const someData = { test: "", ...data };
          await prismaClient.project.update({
            where: {
              slug: params.slug,
            },
            data: {
              // ...someData,
              ...data,
            },
          });
        } catch (e) {
          console.warn(e);
          ctx.addIssue({
            code: "custom",
            message:
              "Die Daten konnten nicht gespeichert werden. Bitte versuche es erneut oder wende dich an den Support",
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json({ status: "error", submission } as const, { status: 400 });
  }

  return redirectWithAlert(
    `/next/project/${params.slug}/settings/details?deep`,
    {
      message: "Deine Änderungen wurden gespeichert.",
    }
  );
}

function WebSocial() {
  const location = useLocation();
  const loaderData = useLoaderData<typeof loader>();
  const { project } = loaderData;
  const actionData = useActionData<typeof action>();
  const formId = "web-social-form";
  const [form, fields] = useForm({
    id: formId,
    constraint: getFieldsetConstraint(webSocialSchema),
    defaultValue: {
      website: project.website || undefined,
      facebook: project.facebook || undefined,
      linkedin: project.linkedin || undefined,
      xing: project.xing || undefined,
      twitter: project.twitter || undefined,
      mastodon: project.mastodon || undefined,
      blueSky: project.blueSky || undefined,
      instagram: project.instagram || undefined,
      youtube: project.youtube || undefined,
    },
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: webSocialSchema });
    },
  });

  return (
    <>
      <BackButton to={location.pathname}>
        Website und Soziale Netwerke
      </BackButton>
      <p>
        Wo kann die Community mehr über Dein Projekt oder Bildungsangebot
        erfahren?
      </p>
      <Form method="post" {...form.props}>
        <h2>Website</h2>
        <div>
          <label htmlFor={fields.website.id}>URL</label>
          <input
            autoFocus
            className="ml-2"
            {...conform.input(fields.website)}
          />
          {fields.website.errors !== undefined &&
            fields.website.errors.length > 0 && (
              <ul id={fields.website.errorId}>
                {fields.website.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <h2>Soziale Netzwerke</h2>
        <div>
          <label htmlFor={fields.facebook.id}>facebook</label>
          <input className="ml-2" {...conform.input(fields.facebook)} />
          {fields.facebook.errors !== undefined &&
            fields.facebook.errors.length > 0 && (
              <ul id={fields.facebook.errorId}>
                {fields.facebook.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <div>
          <label htmlFor={fields.linkedin.id}>LinkedIn</label>
          <input className="ml-2" {...conform.input(fields.linkedin)} />
          {fields.linkedin.errors !== undefined &&
            fields.linkedin.errors.length > 0 && (
              <ul id={fields.linkedin.errorId}>
                {fields.linkedin.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <div>
          <label htmlFor={fields.xing.id}>Xing</label>
          <input className="ml-2" {...conform.input(fields.xing)} />
          {fields.xing.errors !== undefined && fields.xing.errors.length > 0 && (
            <ul id={fields.xing.errorId}>
              {fields.xing.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor={fields.twitter.id}>X (Twitter)</label>
          <input className="ml-2" {...conform.input(fields.twitter)} />
          {fields.twitter.errors !== undefined &&
            fields.twitter.errors.length > 0 && (
              <ul id={fields.twitter.errorId}>
                {fields.twitter.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <div>
          <label htmlFor={fields.mastodon.id}>Mastodon</label>
          <input className="ml-2" {...conform.input(fields.mastodon)} />
          {fields.mastodon.errors !== undefined &&
            fields.mastodon.errors.length > 0 && (
              <ul id={fields.mastodon.errorId}>
                {fields.mastodon.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <div>
          <label htmlFor={fields.blueSky.id}>Blue Sky</label>
          <input className="ml-2" {...conform.input(fields.blueSky)} />
          {fields.blueSky.errors !== undefined &&
            fields.blueSky.errors.length > 0 && (
              <ul id={fields.blueSky.errorId}>
                {fields.blueSky.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <div>
          <label htmlFor={fields.instagram.id}>Instagram</label>
          <input className="ml-2" {...conform.input(fields.instagram)} />
          {fields.instagram.errors !== undefined &&
            fields.instagram.errors.length > 0 && (
              <ul id={fields.instagram.errorId}>
                {fields.instagram.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>
        <div>
          <label htmlFor={fields.youtube.id}>YouTube</label>
          <input className="ml-2" {...conform.input(fields.youtube)} />
          {fields.youtube.errors !== undefined &&
            fields.youtube.errors.length > 0 && (
              <ul id={fields.youtube.errorId}>
                {fields.youtube.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
        </div>

        <ul id={form.errorId}>
          {form.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>

        <p>*Erforderliche Angaben</p>

        <div>
          <button type="reset">Änderungen verwerfen</button>
        </div>
        <div>
          {/* TODO: Add diabled attribute. Note: I'd like to use a hook from kent that needs remix v2 here. see /app/lib/utils/hooks.ts  */}
          <button type="submit">Speichern und weiter</button>
        </div>
      </Form>
    </>
  );
}

export default WebSocial;
