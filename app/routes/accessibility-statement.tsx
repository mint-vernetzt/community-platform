import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["accessibility-statement"];
  return {
    locales,
    baseUrl: process.env.COMMUNITY_BASE_URL,
    supportMail: process.env.SUPPORT_MAIL,
  };
};

export default function Imprint() {
  const { locales, baseUrl, supportMail } = useLoaderData<typeof loader>();

  return (
    <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl my-8 @md:my-10 @lg:my-20">
      <h1>{locales.title}</h1>
      <p>{locales.date}</p>
      <section className="mt-6">
        <h2>{locales.scope.title}</h2>
        <p>
          {insertComponentsIntoLocale(
            insertParametersIntoLocale(locales.scope.content, {
              baseUrl: baseUrl,
            }),
            [
              <TextButton
                key="baseUrl"
                as="link"
                to="/"
                className="inline-flex"
                prefetch="intent"
              />,
            ]
          )}
        </p>
      </section>
      <section className="mt-6">
        <h2>{locales.legalBasis.title}</h2>
        <p>{locales.legalBasis.content}</p>
      </section>
      <section className="mt-6">
        <h2>{locales.complianceStatus.title}</h2>
        <p>{locales.complianceStatus.disclaimer}</p>
        <h3 className="mt-4">
          {locales.complianceStatus.restrictions.userGeneratedContent.title}
        </h3>
        <p className="mb-4">
          {insertComponentsIntoLocale(
            locales.complianceStatus.restrictions.userGeneratedContent.subline,
            [
              <span
                key="highlight-user-generated-content"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <ul className="list-disc list-inside">
          <li>
            {
              locales.complianceStatus.restrictions.userGeneratedContent.list
                .altTexts
            }
          </li>
          <li>
            {
              locales.complianceStatus.restrictions.userGeneratedContent.list
                .material
            }
          </li>
          <li>
            {
              locales.complianceStatus.restrictions.userGeneratedContent.list
                .videos
            }
          </li>
        </ul>
        <h3 className="mt-4">
          {locales.complianceStatus.restrictions.ownContent.title}
        </h3>
        <p className="mb-4">
          {insertComponentsIntoLocale(
            locales.complianceStatus.restrictions.ownContent.subline,
            [<span key="highlight own content" className="font-semibold" />]
          )}
        </p>
        <ul className="list-disc list-inside">
          <li>
            {locales.complianceStatus.restrictions.ownContent.list.altTexts}
          </li>
          <li>
            {
              locales.complianceStatus.restrictions.ownContent.list
                .simpleLanguage
            }
          </li>
          <li>
            {locales.complianceStatus.restrictions.ownContent.list.signLanguage}
          </li>
          <li>
            {locales.complianceStatus.restrictions.ownContent.list.structural}
          </li>
          <li>
            {locales.complianceStatus.restrictions.ownContent.list.contrast}
          </li>
          <li>
            {
              locales.complianceStatus.restrictions.ownContent.list
                .keyboardInteraction
            }
          </li>
          <li>
            {locales.complianceStatus.restrictions.ownContent.list.metaTitles}
          </li>
          <li>{locales.complianceStatus.restrictions.ownContent.list.links}</li>
          <li>
            {locales.complianceStatus.restrictions.ownContent.list.syntax}
          </li>
        </ul>
      </section>
      <section className="mt-6">
        <h2>{locales.measuresToImprove.title}</h2>
        <p className="mb-4">{locales.measuresToImprove.subline}</p>
        <ul className="list-disc list-inside">
          <li>
            {insertComponentsIntoLocale(
              locales.measuresToImprove.regularChecks,
              [
                <span
                  key="highlight-regular-checks"
                  className="font-semibold"
                />,
              ]
            )}
          </li>
          <li>
            {insertComponentsIntoLocale(locales.measuresToImprove.training, [
              <span key="highlight-training" className="font-semibold" />,
            ])}
          </li>
          <li>
            {insertComponentsIntoLocale(
              locales.measuresToImprove.userFeedback,
              [<span key="highlight-user-feedback" className="font-semibold" />]
            )}
          </li>
        </ul>
      </section>
      <section className="mt-6">
        <h2>{locales.reportBarriers.title}</h2>
        <p className="mb-4">{locales.reportBarriers.subline}</p>
        <ul className="list-disc list-inside mb-4">
          <li>
            {insertComponentsIntoLocale(
              insertParametersIntoLocale(locales.reportBarriers.email, {
                supportMail: supportMail,
              }),
              [
                <span key="highlight-email" className="font-semibold" />,
                <TextButton
                  key="email-link"
                  as="link"
                  to={`mailto:${supportMail}`}
                  className="inline-flex"
                />,
              ]
            )}
          </li>
          <li>
            {insertComponentsIntoLocale(locales.reportBarriers.phone, [
              <span key="highlight-phone" className="font-semibold" />,
              <TextButton
                key="phone-link"
                as="link"
                to="tel:+491621696019"
                className="inline-flex"
              />,
              <TextButton
                key="contact-person"
                as="link"
                to="/profile/ingaleffers"
                className="inline-flex"
                prefetch="intent"
              />,
            ])}
          </li>
        </ul>
        <p>{locales.reportBarriers.disclaimer}</p>
      </section>
      <section className="mt-6">
        <h2>{locales.moreInformation.title}</h2>
        <p>
          {insertComponentsIntoLocale(locales.moreInformation.content, [
            <TextButton
              key="more-info-link"
              as="link"
              to="https://www.mint-vernetzt.de"
              className="inline-flex"
              rel="noreferrer noopener"
              target="_blank"
            />,
          ])}
        </p>
      </section>
      <section className="mt-6">
        <p>{locales.notice}</p>
      </section>
    </section>
  );
}
