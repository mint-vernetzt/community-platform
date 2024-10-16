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
import { RichText } from "~/components/Richtext/RichText";

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

function hasContactOrSoMeInformation(organization: {
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

function hasContactInformation(organization: {
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  street: string | null;
  streetNumber: string | null;
  zipCode: string | null;
}) {
  return (
    organization.email !== null ||
    organization.phone !== null ||
    organization.website !== null ||
    hasAddress(organization)
  );
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
      <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-pt-0 @sm:mv-py-10 @lg:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-6 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
        {organization.bio !== null ? (
          <div className="mv-flex mv-flex-col mv-gap-4">
            <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
              {t("headlines.bio")}
            </h2>
            <div>
              <RichText
                html={organization.bio}
                additionalClassNames="mv-text-neutral-600 mv-text-lg"
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
            <p className="mv-text-neutral-700 mv-text-lg mv-leading-6">
              {organization.supportedBy.join(" / ")}
            </p>
          </div>
        ) : null}
      </Container.Section>
      {hasContactOrSoMeInformation(organization) ? (
        <Container.Section className="mv-py-6 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-6 @sm:mv-border @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-2xl mv-mb-4">
          <h3 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {t("headlines.contact")}
          </h3>
          <address className="mv-flex mv-flex-col mv-gap-4 mv-text-neutral-600 mv-leading-5">
            {hasContactInformation(organization) ? (
              <div className="mv-grid mv-grid-flow-row mv-auto-rows-fr mv-gap-2">
                {organization.email !== null ? (
                  <Link
                    to={`mailto:${organization.email}`}
                    className="mv-py-3 mv-px-4 mv-flex mv-gap-4 mv-bg-neutral-100 mv-rounded-lg mv-items-center"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 6.6001C0 5.80445 0.316071 5.04139 0.87868 4.47878C1.44129 3.91617 2.20435 3.6001 3 3.6001H21C21.7956 3.6001 22.5587 3.91617 23.1213 4.47878C23.6839 5.04139 24 5.80445 24 6.6001V18.6001C24 19.3957 23.6839 20.1588 23.1213 20.7214C22.5587 21.284 21.7956 21.6001 21 21.6001H3C2.20435 21.6001 1.44129 21.284 0.87868 20.7214C0.316071 20.1588 0 19.3957 0 18.6001V6.6001ZM3 5.1001C2.60218 5.1001 2.22064 5.25813 1.93934 5.53944C1.65804 5.82074 1.5 6.20227 1.5 6.6001V6.9256L12 13.2256L22.5 6.9256V6.6001C22.5 6.20227 22.342 5.82074 22.0607 5.53944C21.7794 5.25813 21.3978 5.1001 21 5.1001H3ZM22.5 8.6746L15.438 12.9121L22.5 17.2576V8.6746ZM22.449 18.9886L13.989 13.7821L12 14.9746L10.011 13.7821L1.551 18.9871C1.63624 19.3063 1.82447 19.5884 2.08648 19.7897C2.34849 19.9909 2.66962 20.1 3 20.1001H21C21.3302 20.1001 21.6512 19.9912 21.9131 19.7903C22.1751 19.5893 22.3635 19.3075 22.449 18.9886ZM1.5 17.2576L8.562 12.9121L1.5 8.6746V17.2576Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{organization.email}</span>
                  </Link>
                ) : null}
                {organization.phone !== null ? (
                  <Link
                    to={`tel:${organization.phone}`}
                    className="mv-py-3 mv-px-4 mv-flex mv-gap-4 mv-bg-neutral-100 mv-rounded-lg mv-items-center"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.13358 2.99335C6.05388 2.89083 5.95329 2.80645 5.83848 2.7458C5.72367 2.68515 5.59726 2.64962 5.46767 2.64158C5.33807 2.63353 5.20824 2.65316 5.08681 2.69914C4.96538 2.74513 4.85513 2.81643 4.76337 2.9083L3.36751 4.30552C2.71548 4.9589 2.47519 5.88363 2.76003 6.69496C3.94224 10.0531 5.86533 13.102 8.38666 15.6155C10.9002 18.1368 13.9491 20.0599 17.3072 21.2422C18.1185 21.527 19.0432 21.2868 19.6966 20.6347L21.0925 19.2389C21.1843 19.1471 21.2556 19.0368 21.3016 18.9154C21.3476 18.794 21.3672 18.6642 21.3592 18.5346C21.3511 18.405 21.3156 18.2785 21.255 18.1637C21.1943 18.0489 21.1099 17.9483 21.0074 17.8686L17.8931 15.4468C17.7835 15.3619 17.6562 15.3029 17.5205 15.2744C17.3849 15.2458 17.2445 15.2485 17.1101 15.2821L14.1537 16.0205C13.7591 16.1192 13.3456 16.1139 12.9536 16.0053C12.5616 15.8968 12.2044 15.6885 11.9168 15.4009L8.6013 12.084C8.31345 11.7965 8.10496 11.4394 7.99613 11.0474C7.88731 10.6554 7.88186 10.2419 7.98032 9.84713L8.7201 6.89071C8.75372 6.75624 8.75637 6.6159 8.72784 6.48026C8.69931 6.34463 8.64035 6.21725 8.5554 6.10772L6.13358 2.99335ZM3.74415 1.89043C3.98039 1.65411 4.26419 1.47076 4.57672 1.35255C4.88925 1.23433 5.22336 1.18396 5.55685 1.20477C5.89034 1.22558 6.21559 1.3171 6.511 1.47326C6.80641 1.62941 7.06522 1.84662 7.27024 2.11047L9.69207 5.2235C10.1362 5.79453 10.2928 6.53836 10.1173 7.24035L9.37887 10.1968C9.3407 10.3499 9.34276 10.5103 9.38486 10.6624C9.42697 10.8145 9.50768 10.9531 9.61917 11.0648L12.936 14.3817C13.0478 14.4934 13.1867 14.5742 13.339 14.6163C13.4914 14.6585 13.6521 14.6604 13.8054 14.622L16.7604 13.8835C17.1069 13.7969 17.4684 13.7902 17.8178 13.8639C18.1672 13.9375 18.4953 14.0897 18.7773 14.3088L21.8903 16.7306C23.0094 17.6013 23.112 19.2551 22.1103 20.2554L20.7145 21.6512C19.7155 22.6502 18.2224 23.089 16.8306 22.5989C13.2684 21.3455 10.034 19.3061 7.36744 16.6321C4.69356 13.9659 2.65421 10.732 1.40062 7.17015C0.91194 5.77968 1.35068 4.28527 2.34965 3.28629L3.7455 1.89043H3.74415Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{organization.phone}</span>
                  </Link>
                ) : null}
                {organization.website !== null ? (
                  <Link
                    to={organization.website}
                    target="__blank"
                    rel="noopener noreferrer"
                    className="mv-py-3 mv-px-4 mv-flex mv-gap-4 mv-bg-neutral-100 mv-rounded-lg mv-items-center"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.3999 11.9999C2.3999 9.45382 3.41133 7.01203 5.21168 5.21168C7.01203 3.41133 9.45382 2.3999 11.9999 2.3999C14.546 2.3999 16.9878 3.41133 18.7881 5.21168C20.5885 7.01203 21.5999 9.45382 21.5999 11.9999C21.5999 14.546 20.5885 16.9878 18.7881 18.7881C16.9878 20.5885 14.546 21.5999 11.9999 21.5999C9.45382 21.5999 7.01203 20.5885 5.21168 18.7881C3.41133 16.9878 2.3999 14.546 2.3999 11.9999ZM11.3999 3.6923C10.5959 3.9371 9.7979 4.6763 9.1355 5.9183C8.9639 6.2399 8.8043 6.5903 8.6615 6.9647C9.5075 7.1531 10.4279 7.2731 11.3999 7.3091V3.6923ZM7.4987 6.6467C7.6691 6.1859 7.8635 5.7539 8.0759 5.3531C8.28339 4.96077 8.52301 4.58629 8.7923 4.2335C7.7707 4.65686 6.8426 5.2775 6.0611 6.0599C6.4955 6.2807 6.9767 6.4787 7.4987 6.6479V6.6467ZM6.6107 11.3999C6.6539 10.1159 6.8363 8.8955 7.1339 7.7903C6.48434 7.58257 5.85561 7.31461 5.2559 6.9899C4.30016 8.27313 3.73289 9.80375 3.6215 11.3999H6.6095H6.6107ZM8.2907 8.1107C8.0078 9.18562 7.84679 10.289 7.8107 11.3999H11.3999V8.5091C10.3079 8.4731 9.2603 8.3351 8.2907 8.1107ZM12.5999 8.5079V11.3999H16.1879C16.1522 10.289 15.9916 9.18566 15.7091 8.1107C14.7395 8.3351 13.6919 8.4719 12.5999 8.5091V8.5079ZM7.8119 12.5999C7.8539 13.7843 8.0231 14.8967 8.2907 15.8891C9.31197 15.6573 10.3532 15.5243 11.3999 15.4919V12.5999H7.8119ZM12.5999 12.5999V15.4907C13.6919 15.5267 14.7395 15.6647 15.7091 15.8891C15.9767 14.8967 16.1459 13.7843 16.1891 12.5999H12.5999ZM8.6615 17.0351C8.8055 17.4095 8.9639 17.7599 9.1355 18.0815C9.7979 19.3235 10.5971 20.0615 11.3999 20.3075V16.6919C10.4279 16.7279 9.5075 16.8479 8.6615 17.0363V17.0351ZM8.7935 19.7663C8.52378 19.4136 8.28376 19.0391 8.0759 18.6467C7.85489 18.2284 7.66206 17.7959 7.4987 17.3519C7.00506 17.5105 6.52443 17.7071 6.0611 17.9399C6.8426 18.7223 7.7707 19.3429 8.7923 19.7663H8.7935ZM7.1339 16.2095C6.82235 15.0302 6.64642 13.8191 6.6095 12.5999H3.6215C3.73282 14.1961 4.3001 15.7267 5.2559 17.0099C5.8199 16.7003 6.4499 16.4315 7.1339 16.2095ZM15.2075 19.7663C16.2286 19.3432 17.1563 18.723 17.9375 17.9411C17.4746 17.7084 16.9943 17.5118 16.5011 17.3531C16.3377 17.7967 16.1449 18.2288 15.9239 18.6467C15.7165 19.0391 15.4768 19.4136 15.2075 19.7663ZM12.5999 16.6907V20.3075C13.4039 20.0627 14.2019 19.3235 14.8643 18.0815C15.0359 17.7599 15.1955 17.4095 15.3383 17.0351C14.4378 16.8377 13.5212 16.7228 12.5999 16.6919V16.6907ZM16.8659 16.2095C17.5499 16.4315 18.1799 16.7003 18.7439 17.0099C19.6997 15.7267 20.267 14.1961 20.3783 12.5999H17.3903C17.3534 13.8191 17.1775 15.0302 16.8659 16.2095ZM20.3783 11.3999C20.267 9.80374 19.6997 8.27309 18.7439 6.9899C18.1799 7.2995 17.5499 7.5683 16.8659 7.7903C17.1635 8.8943 17.3459 10.1159 17.3903 11.3999H20.3783ZM15.9239 5.3531C16.1363 5.7539 16.3307 6.1859 16.5023 6.6467C16.9951 6.488 17.475 6.29141 17.9375 6.0587C17.1561 5.27729 16.2285 4.65749 15.2075 4.2347C15.4691 4.5743 15.7091 4.9511 15.9239 5.3531ZM15.3383 6.9647C15.202 6.60649 15.0437 6.25702 14.8643 5.9183C14.2019 4.6763 13.4039 3.9383 12.5999 3.6923V7.3079C13.5719 7.2719 14.4923 7.1519 15.3383 6.9635V6.9647Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{organization.website}</span>
                  </Link>
                ) : null}
                {hasAddress(organization) ? (
                  <div className="mv-py-3 mv-px-4 mv-flex mv-gap-4 mv-bg-neutral-100 mv-rounded-lg mv-items-center">
                    <svg
                      width="12"
                      height="20"
                      viewBox="0 0 12 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 1.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2ZM1.2 5.2a4.8 4.8 0 1 1 5.4 4.762V16.6a.6.6 0 1 1-1.2 0V9.964a4.8 4.8 0 0 1-4.2-4.766V5.2Zm2.992 10.289a.6.6 0 0 1-.494.69c-.854.141-1.536.354-1.986.591-.165.08-.315.187-.444.318a.363.363 0 0 0-.068.108v.004l.002.01a.174.174 0 0 0 .02.039.74.74 0 0 0 .174.18c.198.156.522.324.975.474.901.3 2.184.497 3.63.497 1.444 0 2.727-.196 3.628-.497.454-.151.778-.318.976-.474a.744.744 0 0 0 .175-.18.18.18 0 0 0 .018-.04l.002-.01v-.004a.362.362 0 0 0-.068-.108 1.58 1.58 0 0 0-.444-.317c-.451-.237-1.132-.45-1.986-.591a.6.6 0 1 1 .197-1.184c.924.153 1.742.394 2.348.713C11.4 16 12 16.48 12 17.2c0 .511-.312.902-.652 1.172-.349.274-.817.496-1.34.67-1.053.351-2.47.558-4.008.558-1.537 0-2.954-.207-4.008-.558-.523-.174-.991-.396-1.34-.67-.34-.27-.652-.66-.652-1.172 0-.719.6-1.2 1.153-1.492.606-.319 1.425-.56 2.349-.713a.6.6 0 0 1 .69.494Z"
                        fill="currentColor"
                      />
                    </svg>
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
              <ul className="mv-grid mv-grid-cols-2 mv-grid-flow-row mv-auto-rows-fr mv-gap-2">
                {ExternalServices.map((service) => {
                  if (organization[service] !== null) {
                    return (
                      <li key={service} className="last:odd:mv-col-span-2">
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
