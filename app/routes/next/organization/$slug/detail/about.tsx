import { Chip } from "@mint-vernetzt/components";
import { type Organization } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import ExternalServiceIcon from "~/components/ExternalService/ExternalServiceIcon";
import i18next from "~/i18next.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { filterOrganization, getOrganization } from "./about.server";
import { Container } from "~/routes/my/__events.components";

const i18nNS = ["routes/next/organization/detail/about", "datasets/focuses"];

export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "next-organization-detail");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const organization = await getOrganization(slug);
  invariantResponse(
    organization !== null,
    t("server.error.organizationNotFound"),
    { status: 404 }
  );

  let filteredOrganization;
  if (mode === "anon") {
    filteredOrganization = filterOrganization(organization);
  } else {
    filteredOrganization = organization;
  }

  return json({
    organization: filteredOrganization,
  });
};

function hasContactData(organization: {
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  street: string | null;
  streetNumber: string | null;
  zipCode: string | null;
  facebook: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  mastodon: string | null;
  tiktok: string | null;
  xing: string | null;
}) {
  return Object.values(organization).some((value) => value !== null);
}

function hasAddress(organization: {
  city: string | null;
  street: string | null;
  streetNumber: string | null;
  zipCode: string | null;
}) {
  return (
    organization.city !== null ||
    organization.street !== null ||
    organization.streetNumber !== null ||
    organization.zipCode !== null
  );
}

function hasStreet(organization: { street: string | null }) {
  return organization.street !== null;
}

function hasSocialService(organization: {
  facebook: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  mastodon: string | null;
  tiktok: string | null;
  xing: string | null;
}) {
  return Object.values(organization).some((value) => value !== null);
}

const ExternalServices: Array<
  keyof Pick<
    Organization,
    | "facebook"
    | "linkedin"
    | "twitter"
    | "youtube"
    | "instagram"
    | "xing"
    | "mastodon"
    | "tiktok"
  >
> = [
  "mastodon",
  "linkedin",
  "facebook",
  "instagram",
  "twitter",
  "tiktok",
  "youtube",
  "xing",
];

function About() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const { organization } = loaderData;

  return (
    <>
      <Container.Section className="-mv-mt-4 mv-py-10 @lg:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
        {organization.bio !== null ? (
          <>
            <h2>{t("headlines.bio")}</h2>
            <p>{organization.bio}</p>
          </>
        ) : null}
        {organization.areas.length > 0 ? (
          <>
            <h3>{t("headlines.areas")}</h3>
            <Chip.Container>
              {organization.areas.map((relation) => {
                return (
                  <Chip key={relation.area.slug} color="primary">
                    {relation.area.name}
                  </Chip>
                );
              })}
            </Chip.Container>
          </>
        ) : null}
        {organization.focuses.length > 0 ? (
          <>
            <h3>{t("headlines.focuses")}</h3>
            <Chip.Container>
              {organization.focuses.map((relation) => {
                return (
                  <Chip key={relation.focus.slug} color="primary">
                    {t(`${relation.focus.slug}.title`, {
                      ns: "datasets/focuses",
                    })}
                  </Chip>
                );
              })}
            </Chip.Container>
          </>
        ) : null}
        {organization.supportedBy.length > 0 ? (
          <>
            <h3>{t("headlines.supportedBy")}</h3>
            <p>{organization.supportedBy.join(" / ")}</p>
          </>
        ) : null}
      </Container.Section>
      {hasContactData(organization) ? (
        <Container.Section className="mv-py-6 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-4 @sm:mv-border @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-2xl">
          <h3>{t("headlines.contact")}</h3>
          <address>
            {organization.email !== null ? (
              <Link to={`mailto:${organization.email}`}>
                {organization.email}
              </Link>
            ) : null}
            {organization.phone !== null ? (
              <Link to={`tel:${organization.phone}`}>{organization.phone}</Link>
            ) : null}
            {organization.website !== null ? (
              <Link
                to={organization.website}
                target="__blank"
                rel="noopener noreferrer"
              >
                {organization.website}
              </Link>
            ) : null}
            {hasAddress(organization) ? (
              <>
                {hasStreet(organization) ? (
                  <p>
                    <span>{organization.street}</span>
                    {organization.streetNumber !== null ? (
                      <span>{organization.streetNumber}</span>
                    ) : (
                      ""
                    )}
                  </p>
                ) : null}
                <p>
                  {organization.zipCode !== null ? (
                    <span>{organization.zipCode}</span>
                  ) : (
                    ""
                  )}
                  {organization.city !== null ? (
                    <span>{organization.city}</span>
                  ) : (
                    ""
                  )}
                </p>
              </>
            ) : null}
            {hasSocialService(organization) ? (
              <ul>
                {ExternalServices.map((service) => {
                  if (organization[service] !== null) {
                    return (
                      <li key={service}>
                        <ExternalServiceIcon
                          service={service}
                          url={organization[service]}
                        />
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            ) : null}
          </address>
        </Container.Section>
      ) : null}
    </>
  );
}

export default About;
