import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { type LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RichText } from "~/components/Richtext/RichText";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { Container } from "~/components-next/MyEventsOrganizationDetailContainer";
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
} from "./about.shared";
import { hasAboutData } from "../detail.shared";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/detail/about"];

  const organization = await getOrganization(slug);
  invariantResponse(
    organization !== null,
    locales.route.server.error.organizationNotFound,
    { status: 404 }
  );

  let filteredOrganization;
  if (mode === "anon") {
    filteredOrganization = filterOrganization(organization);
  } else {
    filteredOrganization = organization;
  }

  return {
    organization: filteredOrganization,
    mode,
    locales,
  };
};

function About() {
  const loaderData = useLoaderData<typeof loader>();
  const { organization, mode, locales } = loaderData;
  const numberOfSocialServices = Object.entries(ExternalServiceIcons).filter(
    ([key]) => {
      return organization[key as keyof typeof ExternalServiceIcons] !== null;
    }
  ).length;

  return (
    <>
      {hasAboutData(organization) ? (
        <>
          {hasGeneralInformation(organization) ? (
            <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-6 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
              {organization.bio !== null ? (
                <div className="mv-flex mv-flex-col mv-gap-4">
                  <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
                    {locales.route.headlines.bio}
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
                    {locales.route.headlines.areas}
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
                    {locales.route.headlines.focuses}
                  </h3>
                  <Chip.Container>
                    {organization.focuses.map((relation) => {
                      let title;
                      if (relation.focus.slug in locales.focuses) {
                        type LocaleKey = keyof typeof locales.focuses;
                        title =
                          locales.focuses[relation.focus.slug as LocaleKey]
                            .title;
                      } else {
                        console.error(
                          `Focus ${relation.focus.slug} not found in locales`
                        );
                        title = relation.focus.slug;
                      }
                      return (
                        <Chip key={relation.focus.slug} color="primary">
                          {title}
                        </Chip>
                      );
                    })}
                  </Chip.Container>
                </div>
              ) : null}
              {organization.supportedBy.length > 0 ? (
                <div className="mv-flex mv-flex-col mv-gap-2">
                  <h3 className="mv-mb-0 mv-text-neutral-700 mv-text-xs mv-font-semibold mv-leading-5">
                    {locales.route.headlines.supportedBy}
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
                {locales.route.headlines.contact}
              </h3>
              <address className="mv-not-italic mv-w-full mv-flex mv-flex-col @md:mv-flex-row mv-gap-4 @md:mv-gap-6 mv-text-neutral-600 mv-leading-5">
                {hasContactInformation(organization) ? (
                  <div className="mv-w-full mv-grid mv-grid-flow-row mv-auto-rows-min mv-gap-2">
                    {Object.entries(ContactInformationIcons).map(
                      ([key, value]) => {
                        const typedKey =
                          key as keyof typeof ContactInformationIcons;
                        let to;

                        if (typedKey === "address") {
                          return null;
                        } else if (typedKey === "email") {
                          to = `mailto:${organization.email}`;
                        } else if (typedKey === "phone") {
                          to = `tel:${organization.phone}`;
                        } else {
                          to = organization.website;
                        }

                        if (organization[typedKey] === null) {
                          return null;
                        }

                        if (to === null) {
                          return null;
                        }

                        return (
                          <Link
                            key={key}
                            to={to}
                            rel="noopener noreferrer"
                            target="_blank"
                            className="mv-py-3 mv-px-4 mv-flex mv-gap-4 mv-bg-neutral-100 mv-rounded-lg mv-items-center"
                          >
                            <span className="mv-text-neutral-700 mv-font-semibold">
                              {value}
                            </span>
                            <span>{organization[typedKey]}</span>
                          </Link>
                        );
                      }
                    )}
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
                    {Object.entries(ExternalServiceIcons).map(
                      ([key, value]) => {
                        const typedKey =
                          key as keyof typeof ExternalServiceIcons;
                        if (organization[typedKey] !== null) {
                          return (
                            <li key={key}>
                              <Link
                                // Even if typescript claims that organization[typedKey] has the correct type i needed to add the below assertion to make the compiler happy when running npm run typecheck
                                to={organization[typedKey] as string}
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
                      }
                    )}
                  </ul>
                ) : null}
              </address>
            </Container.Section>
          ) : null}
        </>
      ) : (
        <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-6 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
          <div className="mv-w-full mv-flex mv-flex-col mv-gap-4">
            <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
              {locales.route.headlines.bio}
            </h2>
            <div className="mv-w-full mv-flex mv-flex-col mv-gap-8 mv-items-center">
              {/* TODO: SVG */}
              <div className="mv-w-full mv-flex mv-flex-col mv-gap-4 mv-items-center">
                <div className="mv-w-full mv-flex mv-flex-col mv-gap-4 mv-items-center mv-text-neutral-700 mv-text-center">
                  <p className="mv-text-xl mv-font-bold mv-leading-6">
                    {mode === "admin"
                      ? locales.route.blankState.owner.title
                      : locales.route.blankState.anon.title}
                  </p>
                  {mode === "admin" ? (
                    <p className="mv-text-lg">
                      {locales.route.blankState.owner.description}
                    </p>
                  ) : null}
                </div>
                {mode === "admin" ? (
                  <Button
                    as="link"
                    to={`/organization/${organization.slug}/settings`}
                  >
                    {locales.route.blankState.owner.cta}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Container.Section>
      )}
    </>
  );
}

export default About;
