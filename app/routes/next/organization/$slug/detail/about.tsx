import { Chip } from "@mint-vernetzt/components";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RichText } from "~/components/Richtext/RichText";
import i18next from "~/i18next.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { Container } from "~/routes/my/__events.components";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { filterOrganization, getOrganization } from "./about.server";
import {
  ContactInformationIcons,
  ExternalServiceIcons,
  hasAddress,
  hasContactInformation,
  hasContactOrSoMeInformation,
  hasGeneralInformation,
  hasSocialService,
  hasStreet,
  i18nNS,
} from "./__about.shared";

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

function About() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const { organization } = loaderData;
  const numberOfSocialServices = Object.entries(ExternalServiceIcons).filter(
    ([key]) => {
      return organization[key as keyof typeof ExternalServiceIcons] !== null;
    }
  ).length;

  return (
    <>
      {hasGeneralInformation(organization) ? (
        <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-6 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
          {organization.bio !== null ? (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
                {t("headlines.bio")}
              </h2>
              <div>
                <RichText
                  html={organization.bio}
                  additionalClassNames="mv-text-neutral-600 mv-text-lg mv-max-w-[800px]"
                />
              </div>
            </div>
          ) : null}
          {organization.areas.length > 0 ? (
            <div className="mv-flex mv-flex-col mv-gap-2">
              <h3 className="mv-mb-0 mv-text-neutral-700 mv-text-xs mv-font-semibold mv-leading-5">
                {t("headlines.areas")}
              </h3>
              <Chip.Container>
                {organization.areas.map((relation) => {
                  return (
                    <Chip key={relation.area.slug} color="primary">
                      {relation.area.name}
                    </Chip>
                  );
                })}
              </Chip.Container>
            </div>
          ) : null}
          {organization.focuses.length > 0 ? (
            <div className="mv-flex mv-flex-col mv-gap-2">
              <h3 className="mv-mb-0 mv-text-neutral-700 mv-text-xs mv-font-semibold mv-leading-5">
                {t("headlines.focuses")}
              </h3>
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
            </div>
          ) : null}
          {organization.supportedBy.length > 0 ? (
            <div className="mv-flex mv-flex-col mv-gap-2">
              <h3 className="mv-mb-0 mv-text-neutral-700 mv-text-xs mv-font-semibold mv-leading-5">
                {t("headlines.supportedBy")}
              </h3>
              <p className="mv-text-neutral-700 mv-text-lg mv-leading-6 mv-max-w-[800px]">
                {organization.supportedBy.join(" / ")}
              </p>
            </div>
          ) : null}
        </Container.Section>
      ) : null}

      {hasContactOrSoMeInformation(organization) ? (
        <Container.Section
          className={`@sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-6 @sm:mv-border-neutral-200 mv-bg-white ${
            hasGeneralInformation(organization)
              ? "mv-py-6 @sm:mv-border @sm:mv-rounded-2xl"
              : "-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 mv-pb-6 @sm:mv-py-8 @sm:mv-border-b @sm:mv-border-x @sm:mv-rounded-b-2xl"
          }`}
        >
          <h3 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {t("headlines.contact")}
          </h3>
          <address className="mv-not-italic mv-w-full mv-flex mv-flex-col @md:mv-flex-row mv-gap-4 @md:mv-gap-6 mv-text-neutral-600 mv-leading-5">
            {hasContactInformation(organization) ? (
              <div className="mv-w-full mv-grid mv-grid-flow-row mv-auto-rows-min mv-gap-2">
                {Object.entries(ContactInformationIcons).map(([key, value]) => {
                  const typedKey = key as keyof typeof ContactInformationIcons;
                  if (typedKey === "address") {
                    return null;
                  }
                  if (organization[typedKey] !== null) {
                    return (
                      <Link
                        key={key}
                        to={`${
                          typedKey === "email"
                            ? "mailto:"
                            : typedKey === "phone"
                            ? "tel:"
                            : ""
                        }${organization.email}`}
                        className="mv-py-3 mv-px-4 mv-flex mv-gap-4 mv-bg-neutral-100 mv-rounded-lg mv-items-center"
                      >
                        <span className="mv-text-neutral-700 mv-font-semibold">
                          {value}
                        </span>
                        <span>{organization[typedKey]}</span>
                      </Link>
                    );
                  }
                  return null;
                })}
                {hasAddress(organization) ? (
                  <div className="mv-py-3 mv-px-4 mv-flex mv-gap-4 mv-bg-neutral-100 mv-rounded-lg mv-items-center">
                    {ContactInformationIcons.address}
                    <div className="mv-flex mv-flex-col mv-gap-1">
                      {hasStreet(organization) ? (
                        <p className="mv-flex mv-gap-1">
                          <span>{organization.street}</span>
                          {organization.streetNumber !== null ? (
                            <span>{organization.streetNumber}</span>
                          ) : (
                            ""
                          )}
                        </p>
                      ) : null}
                      <p className="mv-flex mv-gap-1">
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
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {hasSocialService(organization) ? (
              <ul
                className={`mv-w-full mv-grid ${
                  numberOfSocialServices === 1
                    ? "mv-grid-cols-1"
                    : numberOfSocialServices === 2
                    ? "mv-grid-cols-2"
                    : "mv-grid-cols-2 @md:mv-grid-cols-3"
                } mv-grid-flow-row mv-auto-rows-min mv-gap-2`}
              >
                {Object.entries(ExternalServiceIcons).map(([key, value]) => {
                  const typedKey = key as keyof typeof ExternalServiceIcons;
                  if (organization[typedKey] !== null) {
                    return (
                      <li key={key}>
                        <Link
                          to={organization[typedKey]}
                          target="__blank"
                          rel="noopener noreferrer"
                          className="mv-w-full mv-py-3 mv-px-4 mv-bg-neutral-100 mv-rounded-lg mv-flex mv-justify-center"
                        >
                          {value}
                        </Link>
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
