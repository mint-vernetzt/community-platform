import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getRedirectPathOnProtectedOrganizationRoute } from "./settings.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { Section, TextButton } from "@mint-vernetzt/components";
import { useTranslation } from "react-i18next";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  // check slug exists (throw bad request if not)
  invariantResponse(params.slug !== undefined, "No valid route", {
    status: 400,
  });

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });

  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  const organization = await prismaClient.organization.findFirst({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
    },
  });

  invariantResponse(organization !== null, "Organization not found", {
    status: 404,
  });

  return json({ organization });
}

const i18nNS = ["routes/next/organization/settings"];
export const handle = {
  i18n: i18nNS,
};

function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation(i18nNS);

  return (
    <div className="mv-w-full mv-max-w-none mv-px-0 mv-mx-auto @md:mv-px-4 @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl @md:mv-mt-2">
      <div className="mv-hidden @md:mv-block mv-mb-8">
        <div className="mv-flex mv-flex-col mv-gap-8 @lg:mv-gap-14">
          <TextButton weight="thin" variant="neutral" arrowLeft>
            <Link
              to={`/organization/${loaderData.organization.slug}`}
              prefetch="intent"
            >
              {t("content.back")}
            </Link>
          </TextButton>
          <h3 className="mv-mb-0 mv-font-bold">{t("content.edit")}</h3>
        </div>
      </div>
      <div className="mv-hidden @md:mv-block">
        <Section variant="primary" withBorder>
          <Section.Header>{loaderData.organization.name}</Section.Header>
        </Section>
      </div>
    </div>
  );
}

export default Settings;
