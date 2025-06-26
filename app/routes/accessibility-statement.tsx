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
    <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-my-8 @md:mv-my-10 @lg:mv-my-20">
      <h1>{locales.title}</h1>
      <section className="mv-mt-6">
        <h2>{locales.scope.title}</h2>
        <p>
          {insertComponentsIntoLocale(
            insertParametersIntoLocale(locales.scope.content, {
              baseUrl: baseUrl,
            }),
            [
              <TextButton
                key="baseUrl"
                as="a"
                href="/"
                className="mv-inline-flex"
              />,
            ]
          )}
        </p>
      </section>
      <section className="mv-mt-6">
        <h2>{locales.legalBasis.title}</h2>
        <p>{locales.legalBasis.content}</p>
      </section>
      <section className="mv-mt-6">
        <h2>{locales.complianceStatus.title}</h2>
        <p>{locales.complianceStatus.disclaimer}</p>
        <h3 className="mv-mt-4">
          {locales.complianceStatus.restrictions.userGeneratedContent.title}
        </h3>
        <p className="mv-mb-4">
          {insertComponentsIntoLocale(
            locales.complianceStatus.restrictions.userGeneratedContent.subline,
            [
              <span
                key="highlight-user-generated-content"
                className="mv-font-semibold"
              />,
            ]
          )}
        </p>
        <ul className="mv-list-disc mv-list-inside">
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
        <h3 className="mv-mt-4">
          {locales.complianceStatus.restrictions.ownContent.title}
        </h3>
        <p className="mv-mb-4">
          {insertComponentsIntoLocale(
            locales.complianceStatus.restrictions.ownContent.subline,
            [<span key="highlight own content" className="mv-font-semibold" />]
          )}
        </p>
        <ul className="mv-list-disc mv-list-inside">
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
      <section className="mv-mt-6">
        <h2>{locales.measuresToImprove.title}</h2>
        <p className="mv-mb-4">{locales.measuresToImprove.subline}</p>
        <ul className="mv-list-disc mv-list-inside">
          <li>
            {insertComponentsIntoLocale(
              locales.measuresToImprove.regularChecks,
              [
                <span
                  key="highlight-regular-checks"
                  className="mv-font-semibold"
                />,
              ]
            )}
          </li>
          <li>
            {insertComponentsIntoLocale(locales.measuresToImprove.training, [
              <span key="highlight-training" className="mv-font-semibold" />,
            ])}
          </li>
          <li>
            {insertComponentsIntoLocale(
              locales.measuresToImprove.userFeedback,
              [
                <span
                  key="highlight-user-feedback"
                  className="mv-font-semibold"
                />,
              ]
            )}
          </li>
        </ul>
      </section>
      <section className="mv-mt-6">
        <h2>{locales.reportBarriers.title}</h2>
        <p className="mv-mb-4">{locales.reportBarriers.subline}</p>
        <ul className="mv-list-disc mv-list-inside mv-mb-4">
          <li>
            {insertComponentsIntoLocale(
              insertParametersIntoLocale(locales.reportBarriers.email, {
                supportMail: supportMail,
              }),
              [
                <span key="highlight-email" className="mv-font-semibold" />,
                <TextButton
                  key="email-link"
                  as="a"
                  href={`mailto:${supportMail}`}
                  className="mv-inline-flex"
                />,
              ]
            )}
          </li>
          <li>
            {insertComponentsIntoLocale(locales.reportBarriers.phone, [
              <span key="highlight-phone" className="mv-font-semibold" />,
              <TextButton
                key="phone-link"
                as="a"
                href="tel:+491621696019"
                className="mv-inline-flex"
              />,
              <TextButton
                key="contact-person"
                as="a"
                href="/profile/ingaleffers"
                className="mv-inline-flex"
              />,
            ])}
          </li>
        </ul>
        <p>{locales.reportBarriers.disclaimer}</p>
      </section>
      <section className="mv-mt-6">
        <h2>{locales.moreInformation.title}</h2>
        <p>
          {insertComponentsIntoLocale(locales.moreInformation.content, [
            <TextButton
              key="more-info-link"
              as="a"
              href="https://www.mint-vernetzt.de"
              className="mv-inline-flex"
              rel="noreferrer noopener"
              target="_blank"
            />,
          ])}
        </p>
      </section>
      <section className="mv-mt-6">
        <p>{locales.notice}</p>
      </section>
    </section>
  );
}
