import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "@remix-run/react";
import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { Section, TextButton } from "@mint-vernetzt/components";
import { useTranslation } from "react-i18next";
import { type TFunction } from "i18next";
import classNames from "classnames";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  await checkFeatureAbilitiesOrThrow(authClient, ["next-organization-create"]);

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

function createNavLinks(t: TFunction) {
  return [
    { to: "./general", label: t("links.general") },
    { to: "./organize", label: t("links.organize") },
    { to: "./web-social", label: t("links.webSocial") },
    { to: "./admins", label: t("links.admins") },
    { to: "./team", label: t("links.team") },
    { to: "./danger-zone", label: t("links.dangerZone"), variant: "negative" },
  ];
}

function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const location = useLocation();
  const pathnameWithoutSlug = location.pathname.replace(
    loaderData.organization.slug,
    ""
  );
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(i18nNS);

  const navLinks = createNavLinks(t);

  const deep = searchParams.get("deep");

  const menuClasses = classNames(
    "mv-w-full @md:mv-w-1/3 @2xl:mv-w-1/4 mv-max-h-screen @md:mv-max-h-fit mv-flex mv-flex-col mv-absolute @md:mv-relative mv-top-0 mv-bg-white @md:mv-border-l @md:mv-border-b @md:mv-rounded-bl-xl @md:mv-self-start",
    deep !== null && deep !== "false" && "mv-hidden @md:mv-block"
  );

  const outletClasses = classNames(
    "mv-overflow-hidden @md:mv-w-2/3 @2xl:mv-w-3/4 @md:mv-border-x @md:mv-border-b @md:mv-rounded-b-xl @md:mv-mb-4 @lg:mv-mb-24 mv-bg-white",
    (deep === null || deep === "false") && "mv-hidden @md:mv-block"
  );

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
      <div className="mv-w-full @md:mv-flex @md:mv-mb-20 @lg:mv-mb-0">
        <div className={menuClasses}>
          <div className="mv-flex mv-gap-2 mv-items-center mv-justify-between @md:mv-hidden">
            <span className="mv-p-6 mv-pr-0">
              <h1 className="mv-text-2xl mv-m-0">{t("content.settings")}</h1>
            </span>
            <Link
              to={`/organization/${loaderData.organization.slug}`}
              prefetch="intent"
              className="mv-px-4"
            >
              <svg
                width="32"
                height="33"
                viewBox="0 0 32 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.78618 10.2876L9.78618 10.2876L9.78743 10.2864C9.8153 10.2584 9.84841 10.2363 9.88485 10.2211C9.9213 10.206 9.96037 10.1982 9.99983 10.1982C10.0393 10.1982 10.0784 10.206 10.1148 10.2211C10.1513 10.2363 10.1844 10.2584 10.2122 10.2864L10.2128 10.2869L15.5048 15.5809L15.9998 16.0762L16.4949 15.5809L21.7868 10.287C21.7868 10.287 21.7869 10.2869 21.7869 10.2869C21.8149 10.259 21.848 10.2368 21.8845 10.2217C21.9211 10.2065 21.9603 10.1988 21.9998 10.1988C22.0394 10.1988 22.0786 10.2065 22.1151 10.2217C22.1517 10.2368 22.1849 10.259 22.2129 10.287C22.2408 10.315 22.263 10.3482 22.2782 10.3847L22.9249 10.1168L22.2782 10.3847C22.2933 10.4213 22.3011 10.4604 22.3011 10.5C22.3011 10.5396 22.2933 10.5788 22.2782 10.6153L22.9249 10.8832L22.2782 10.6153C22.263 10.6518 22.2409 10.685 22.213 10.7129C22.2129 10.713 22.2129 10.713 22.2129 10.713L16.919 16.0049L16.4237 16.5L16.919 16.9951L22.2129 22.287C22.2129 22.287 22.2129 22.2871 22.213 22.2871C22.2409 22.315 22.263 22.3482 22.2782 22.3847L22.9249 22.1168L22.2782 22.3847C22.2933 22.4213 22.3011 22.4604 22.3011 22.5C22.3011 22.5396 22.2933 22.5788 22.2782 22.6153L22.9249 22.8832L22.2782 22.6153C22.263 22.6519 22.2408 22.6851 22.2129 22.713C22.1849 22.741 22.1517 22.7632 22.1151 22.7783L22.383 23.4251L22.1151 22.7783C22.0786 22.7935 22.0394 22.8013 21.9998 22.8013C21.9603 22.8013 21.9211 22.7935 21.8845 22.7783L21.6167 23.4251L21.8845 22.7783C21.848 22.7632 21.8149 22.7411 21.7869 22.7131C21.7869 22.7131 21.7868 22.7131 21.7868 22.713L16.4949 17.4191L15.9998 16.9239L15.5048 17.4191L10.2129 22.713C10.2128 22.7131 10.2128 22.7131 10.2128 22.7131C10.1848 22.7411 10.1516 22.7632 10.1151 22.7783L10.383 23.4251L10.1151 22.7783C10.0786 22.7935 10.0394 22.8013 9.99983 22.8013C9.96027 22.8013 9.92109 22.7935 9.88455 22.7783L9.61667 23.4251L9.88454 22.7783C9.848 22.7632 9.81479 22.741 9.78681 22.713C9.75883 22.6851 9.73664 22.6519 9.7215 22.6153C9.70636 22.5788 9.69857 22.5396 9.69857 22.5C9.69857 22.4605 9.70636 22.4213 9.7215 22.3847C9.73662 22.3482 9.75878 22.315 9.78672 22.2871C9.78675 22.2871 9.78678 22.287 9.78681 22.287L15.0807 16.9951L15.576 16.5L15.0807 16.0049L9.78672 10.7129L9.78618 10.7124C9.75824 10.6845 9.73608 10.6514 9.72095 10.615C9.70583 10.5786 9.69805 10.5395 9.69805 10.5C9.69805 10.4606 9.70583 10.4215 9.72095 10.385C9.73608 10.3486 9.75824 10.3155 9.78618 10.2876Z"
                  fill="#154194"
                  stroke="#154194"
                  strokeWidth="1.4"
                />
              </svg>
            </Link>
          </div>
          <ul className="mv-grid mv-grid-cols-1 mv-grid-rows-6">
            {navLinks.map((navLink) => {
              const absolutePath = navLink.to.replace(".", "");
              const isActive = pathnameWithoutSlug.includes(absolutePath);

              const itemClasses = classNames(
                "@md:mv-border-b @md:mv-last:mv-border-b-0 mv-h-full mv-grid mv-grid-rows-1 mv-grid-cols-1",
                isActive && "@md:mv-border-l-8",
                navLink.variant === "negative"
                  ? "@md:mv-border-l-negative"
                  : "@md:mv-border-l-primary"
              );
              const linkClasses = classNames(
                "mv-text-lg @lg:mv-text-2xl mv-font-semibold mv-block mv-place-self-center mv-w-full",
                "mv-px-6 @lg:mv-px-8 mv-py-4 @lg:mv-py-8",
                navLink.variant === "negative"
                  ? "mv-text-negative"
                  : "mv-text-primary",
                isActive && "@lg:mv-pl-6 @lg:mv-pr-8",
                isActive === false &&
                  navLink.variant !== "negative" &&
                  "@lg:mv-text-neutral @lg:mv-hover:mv-text-primary"
              );

              return (
                <li key={navLink.label} className={itemClasses}>
                  {/* TODO: H3 as h1 */}
                  <Link
                    to={`${navLink.to}?deep`}
                    className={linkClasses}
                    prefetch="intent"
                    preventScrollReset
                  >
                    <span className="mv-text-wrap">{navLink.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={outletClasses}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Settings;
