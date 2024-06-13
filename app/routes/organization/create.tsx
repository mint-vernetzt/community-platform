import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Avatar, Button, Input, List } from "@mint-vernetzt/components";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { GravityType, getImageURL } from "~/images.server";
import { getPublicURL } from "~/storage.server";
import { generateOrganizationSlug } from "~/utils.server";
import {
  countOrganizationsBySearchQuery,
  createOrganizationOnProfile,
  searchForOrganizationsByName,
} from "./create.server";
import { detectLanguage } from "~/root.server";

const i18nNS = ["routes/organization/create"];
export const handle = {
  i18n: i18nNS,
};

const createSchema = (t: TFunction) => {
  return z.object({
    organizationName: z
      .string({
        required_error: t("validation.organizationName.required"),
      })
      .min(3, t("validation.organizationName.min")),
  });
};

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const url = new URL(request.url);

  if (sessionUser === null) {
    return redirect(`/login?login_redirect=${url.pathname}`);
  }

  const queryString = url.searchParams.get("search");
  const query = queryString !== null ? queryString.split(" ") : [];

  let searchResult: { name: string; slug: string; logo: string | null }[] = [];

  if (query.length > 0 && queryString !== null && queryString.length >= 3) {
    searchResult = await searchForOrganizationsByName(queryString);
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

  return json({ searchResult });
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  const url = new URL(request.url);

  const queryString = url.searchParams.get("search");

  if (sessionUser === null) {
    return redirect(`/login?login_redirect=${url.pathname}`);
  }

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, ["routes/organization/create"]);

  const formData = await request.formData();
  const submission = parse(formData, { schema: createSchema(t) });

  if (typeof submission.value !== "undefined" && submission.value !== null) {
    if (submission.intent === "submit") {
      const { organizationName } = submission.value;

      const similarOrganizationsCount = await countOrganizationsBySearchQuery(
        organizationName
      );

      if (
        similarOrganizationsCount === 0 ||
        (queryString !== null && queryString === organizationName)
      ) {
        const slug = generateOrganizationSlug(organizationName);
        await createOrganizationOnProfile(
          sessionUser.id,
          submission.value.organizationName,
          slug
        );
        return redirect(`/organization/${slug}`);
      } else {
        const redirectURL = new URL(request.url);
        redirectURL.searchParams.set(
          "search",
          submission.value.organizationName
        );
        return redirect(
          `${redirectURL.pathname}?${redirectURL.searchParams.toString()}`
        );
      }
    }
  }

  return json(submission);
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

  const { t } = useTranslation(i18nNS);

  return (
    <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-[600px] @md:mv-max-w-[768px] @lg:mv-max-w-[1024px] @xl:mv-max-w-[1280px] @xl:mv-px-6 @2xl:mv-max-w-[1536px] mv-relative">
      <div className="flex -mx-4 justify-center">
        <div className="@lg:mv-shrink-0 @lg:mv-grow-0 @lg:mv-basis-1/2 px-4 pt-10 @lg:mv-pt-0">
          <h4 className="font-semibold">{t("content.headline")}</h4>
          <Form
            method="post"
            {...form.props}
            className="mv-flex mv-flex-col mv-gap-4"
          >
            <Input {...conform.input(fields.organizationName)} standalone>
              <Input.Label htmlFor={fields.organizationName.id}>
                {t("form.organizationName.label")}
              </Input.Label>
              {typeof fields.organizationName.error !== "undefined" && (
                <Input.Error>{fields.organizationName.error}</Input.Error>
              )}
            </Input>
            <div className="mv-w-fit-content">
              <Button type="submit" variant="outline">
                {t("form.submit.label")}
              </Button>
            </div>
          </Form>
          {loaderData.searchResult.length > 0 && (
            <div className="mv-flex mv-flex-col mv-gap-2 mv-mt-8">
              <p>
                {t("form.error.sameOrganization", {
                  searchQuery,
                })}
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
