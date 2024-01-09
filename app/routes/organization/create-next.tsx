import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Avatar, Button, Input, List } from "@mint-vernetzt/components";
import { type Organization, type Prisma } from "@prisma/client";
import { json, redirect, type DataFunctionArgs } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { redirectWithToast } from "~/toast.server";
import { generateOrganizationSlug } from "~/utils.server";
import { createOrganizationOnProfile } from "./create.server";

const schema = z.object({
  organizationName: z
    .string({
      required_error: "Bitte gib den Namen Deiner Organisation ein.",
    })
    .min(3, "Der Name der Organisation muss mindestens 3 Zeichen lang sein."),
});

export async function loader(args: DataFunctionArgs) {
  const { request } = args;
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  const url = new URL(request.url);

  if (sessionUser === null) {
    return redirect(`/login?login_redirect=${url.pathname}`, {
      headers: response.headers,
    });
  }

  const queryString = url.searchParams.get("search");
  const query = queryString !== null ? queryString.split(" ") : [];

  let searchResult: { name: string; slug: string; logo: string | null }[] = [];

  if (query.length > 0 && queryString !== null && queryString.length >= 3) {
    const whereQueries: {
      OR: {
        [K in Organization as string]: {
          contains: string;
          mode: Prisma.QueryMode;
        };
      }[];
    }[] = [];
    for (const word of query) {
      whereQueries.push({
        OR: [{ name: { contains: word, mode: "insensitive" } }],
      });
    }
    searchResult = await prismaClient.organization.findMany({
      where: {
        AND: whereQueries,
      },
      select: {
        name: true,
        slug: true,
        logo: true,
      },
      take: 5,
    });
    searchResult = searchResult.map((relation) => {
      let logo = relation.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fill", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { ...relation, logo };
    });
  }

  return json({ searchResult }, { headers: response.headers });
}

export async function action(args: DataFunctionArgs) {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUser(authClient);

  const url = new URL(request.url);

  const queryString = url.searchParams.get("search");

  if (sessionUser === null) {
    return redirect(`/login?login_redirect=${url.pathname}`, {
      headers: response.headers,
    });
  }

  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    if (submission.intent === "submit") {
      const { organizationName } = submission.value;

      if (queryString !== null && queryString === organizationName) {
        const slug = generateOrganizationSlug(organizationName);
        await createOrganizationOnProfile(
          sessionUser.id,
          submission.value.organizationName,
          slug
        );
        return redirectWithToast(
          `/organization/${slug}`,
          {
            key: "organization-created",
            message: `Organisation "${organizationName}" wurde erfolgreich angelegt.`,
          },
          {
            init: { headers: response.headers },
          }
        );
      } else {
        const redirectURL = new URL(request.url);
        redirectURL.searchParams.set(
          "search",
          submission.value.organizationName
        );
        return redirect(
          `${redirectURL.pathname}?${redirectURL.searchParams.toString()}`,
          {
            headers: response.headers,
          }
        );
      }
    }
  }

  return json(submission, { headers: response.headers });
}

function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [searchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";

  const [form, fields] = useForm({
    lastSubmission: actionData,
    defaultValue: {
      organizationName: searchQuery,
    },
  });

  return (
    <div className="mv-container mv-relative">
      <div className="flex -mx-4 justify-center">
        <div className="lg:flex-1/2 px-4 pt-10 lg:pt-0">
          <h4 className="font-semibold">
            Organisation oder Netzwerk hinzufügen
          </h4>
          <Form
            method="post"
            {...form.props}
            className="mv-flex mv-flex-col mv-gap-4"
          >
            <Input {...conform.input(fields.organizationName)} standalone>
              <Input.Label htmlFor={fields.organizationName.id}>
                Name der Organisation*
              </Input.Label>
              {typeof fields.organizationName.error !== "undefined" && (
                <Input.Error>{fields.organizationName.error}</Input.Error>
              )}
            </Input>
            <div className="mv-w-fit-content">
              <Button type="submit" variant="outline">
                Hinzufügen
              </Button>
            </div>
          </Form>
          {loaderData.searchResult.length > 0 && (
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-8">
              <p>
                Es wurden Organisationen mit ähnlichem Namen gefunden. Falls Du
                die Organisation mit Namen "{searchQuery}" anlegen willst,
                klicke erneut auf "Hinzufügen".
              </p>
              <List>
                {loaderData.searchResult.map((organization) => {
                  return (
                    <List.Item key={organization.slug} interactive>
                      <Link to={`/organization/${organization.slug}`}>
                        <List.Item.Info>
                          <List.Item.Title>{organization.name}</List.Item.Title>
                        </List.Item.Info>
                        <Avatar {...organization} />
                      </Link>
                    </List.Item>
                  );
                })}
              </List>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Create;
