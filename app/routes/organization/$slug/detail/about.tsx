import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { Container } from "~/components-next/MyEventsOrganizationDetailContainer";
import { NoInfos } from "~/components/next/NoInfo";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { languageModuleMap } from "~/locales/.server";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { hasAboutData } from "../detail.shared";
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
  } as const;
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
          <Container.Section className="-mt-4 @md:-mt-6 @lg:-mt-8 pt-10 @sm:py-8 @sm:px-4 @lg:px-6 flex flex-col gap-6 @sm:border-b @sm:border-x @sm:border-neutral-200 bg-white @sm:rounded-b-2xl">
            {hasGeneralInformation(organization) ? (
              <>
                {organization.bio !== null ? (
                  <div className="flex flex-col gap-4">
                    <h2 className="mb-0 text-neutral-700 text-xl font-bold leading-6">
                      {locales.route.headlines.bio}
                    </h2>
                    <div>
                      <RichText
                        html={organization.bio}
                        additionalClassNames="text-neutral-600 text-lg max-w-[800px]"
                      />
                    </div>
                  </div>
                ) : null}
                {organization.areas.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <h3 className="mb-0 text-neutral-700 text-xs font-semibold leading-5">
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
                  <div className="flex flex-col gap-2">
                    <h3 className="mb-0 text-neutral-700 text-xs font-semibold leading-5">
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
                  <div className="flex flex-col gap-2">
                    <h3 className="mb-0 text-neutral-700 text-xs font-semibold leading-5">
                      {locales.route.headlines.supportedBy}
                    </h3>
                    <p className="text-neutral-700 text-lg leading-6 max-w-[800px]">
                      {organization.supportedBy.join(" / ")}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <NoInfos
                mode={mode}
                locales={{
                  blankState: { ...locales.route.blankState },
                }}
                ctaLink={`/organization/${organization.slug}/settings/general`}
              />
            )}
          </Container.Section>

          {hasContactOrSoMeInformation(organization) ? (
            <Container.Section className="px-4 @lg:px-6 flex flex-col gap-6 border-neutral-200 bg-white py-6 border rounded-2xl">
              <h3 className="mb-0 text-neutral-700 text-xl font-bold leading-6">
                {locales.route.headlines.contact}
              </h3>
              <address className="not-italic w-full flex flex-col @md:flex-row gap-4 @md:gap-6 text-neutral-600 leading-5">
                {hasContactInformation(organization) ? (
                  <div className="w-full grid grid-flow-row auto-rows-min gap-2">
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
                            className="py-3 px-4 flex gap-4 bg-neutral-100 rounded-lg items-center"
                          >
                            <span className="text-neutral-700 font-semibold">
                              {value}
                            </span>
                            <span>{organization[typedKey]}</span>
                          </Link>
                        );
                      }
                    )}
                    {hasAddress(organization) ? (
                      <div className="py-3 px-4 flex gap-4 bg-neutral-100 rounded-lg items-center">
                        {ContactInformationIcons.address}
                        <div className="flex flex-col gap-1">
                          {hasStreet(organization) ? (
                            <p className="flex gap-1">
                              <span>{organization.street}</span>
                              {organization.addressSupplement !== null ? (
                                <span>{organization.addressSupplement}</span>
                              ) : (
                                ""
                              )}
                            </p>
                          ) : null}
                          <p className="flex gap-1">
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
                    className={`w-full grid ${
                      numberOfSocialServices === 1
                        ? "grid-cols-1"
                        : numberOfSocialServices === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 @md:grid-cols-3"
                    } grid-flow-row auto-rows-min gap-2`}
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
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 bg-neutral-100 rounded-lg flex justify-center"
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
        <Container.Section className="-mt-4 @md:-mt-6 @lg:-mt-8 pt-10 @sm:py-8 @sm:px-4 @lg:px-6 flex flex-col gap-6 @sm:border-b @sm:border-x @sm:border-neutral-200 bg-white @sm:rounded-b-2xl">
          <NoInfos
            mode={mode}
            locales={{
              blankState: { ...locales.route.blankState },
            }}
            ctaLink={`/organization/${organization.slug}/settings/general`}
          />
        </Container.Section>
      )}
    </>
  );
}

export default About;
