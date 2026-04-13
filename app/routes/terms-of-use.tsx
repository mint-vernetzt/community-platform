import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { detectLanguage } from "~/i18n.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["terms-of-use"];
  return {
    locales,
  };
};

export default function TermsOfUse() {
  const { locales } = useLoaderData<typeof loader>();

  return (
    <section className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl mt-8 mb-20">
      <h1>{locales.title}</h1>
      <div className="w-full flex flex-col gap-2 mb-4">
        {locales.description.map((paragraph, index) => {
          if (index === 0) {
            return (
              <p key={index}>
                {insertComponentsIntoLocale(paragraph, [
                  <span
                    key="highlight-mintvernetzt"
                    className="font-semibold"
                  />,
                ])}
              </p>
            );
          }

          return <p key={index}>{paragraph}</p>;
        })}
      </div>

      <h2>{locales.subjectMatter.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        {locales.subjectMatter.description.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <ul className="list-disc list-inside pl-4">
          {locales.subjectMatter.organizations.map((organization, index) => (
            <li key={index}>{organization}</li>
          ))}
        </ul>
        <p>
          {insertComponentsIntoLocale(locales.subjectMatter.contact, [
            <span key="highlight-matrix" className="font-semibold" />,
          ])}
        </p>
      </div>

      <h2>{locales.scope.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>{locales.scope.description}</p>
      </div>

      <h2>{locales.registrationAndLogin.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.registrationAndLogin.mandatoryData.title,
            [<span key="highlight-enumeration-3-1" className="font-bold" />]
          )}
        </p>
        <ul className="list-disc list-inside pl-4">
          {locales.registrationAndLogin.mandatoryData.data.map(
            (data, index) => (
              <li key={index}>{data}</li>
            )
          )}
        </ul>
        <p>
          {insertComponentsIntoLocale(
            locales.registrationAndLogin.profile.title,
            [<span key="highlight-enumeration-3-2" className="font-bold" />]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.registrationAndLogin.login.title,
            [<span key="highlight-enumeration-3-3" className="font-bold" />]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.registrationAndLogin.mintId.title,
            [
              <span
                key="highlight-enumeration-3-4"
                className="font-semibold"
              />,
              <TextButton
                key="mint-id-terms-of-use"
                as="link"
                to="https://mint-id.org/nutzungsbedingungen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              />,
              <TextButton
                key="mint-id-privacy-policy"
                as="link"
                to="https://mint-id.org/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              />,
            ]
          )}
        </p>
      </div>

      <h2>{locales.profile.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(locales.profile.information.title, [
            <span key="highlight-enumeration-4-1" className="font-bold" />,
          ])}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.profile.falseStatements.title, [
            <span key="highlight-enumeration-4-2" className="font-bold" />,
          ])}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.profile.editing.title, [
            <span key="highlight-enumeration-4-3" className="font-bold" />,
          ])}
        </p>
      </div>

      <h2>{locales.deleteProfile.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(locales.deleteProfile.deleting.title, [
            <span key="highlight-enumeration-5-1" className="font-bold" />,
          ])}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.deleteProfile.scope.title, [
            <span key="highlight-enumeration-5-2" className="font-bold" />,
          ])}
        </p>
      </div>

      <h2>{locales.events.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(locales.events.general.title, [
            <span key="highlight-enumeration-6-1" className="font-bold" />,
          ])}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.events.registration.title, [
            <span key="highlight-enumeration-6-2" className="font-bold" />,
          ])}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.events.requirements.title, [
            <span key="highlight-enumeration-6-3" className="font-bold" />,
          ])}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.events.cancellation.title, [
            <span key="highlight-enumeration-6-4" className="font-bold" />,
          ])}
        </p>
      </div>

      <h2>{locales.eventOrganizer.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(locales.eventOrganizer.scope.title, [
            <span key="highlight-enumeration-7-1" className="font-bold" />,
          ])}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.eventOrganizer.dataController.title,
            [<span key="highlight-enumeration-7-2" className="font-bold" />]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.eventOrganizer.dataProcessing.title,
            [<span key="highlight-enumeration-7-3" className="font-bold" />]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(locales.eventOrganizer.disclaimer.title, [
            <span key="highlight-enumeration-7-4" className="font-bold" />,
          ])}
        </p>
      </div>

      <h2>{locales.userResponsibilities.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.userResponsibilities.falseStatements.title,
            [<span key="highlight-enumeration-8-1" className="font-bold" />]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.userResponsibilities.duplicateProfiles.title,
            [<span key="highlight-enumeration-8-2" className="font-bold" />]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.userResponsibilities.loginCredentials.title,
            [<span key="highlight-enumeration-8-3" className="font-bold" />]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.userResponsibilities.scope.title,
            [<span key="highlight-enumeration-8-4" className="font-bold" />]
          )}
        </p>
      </div>

      <h2>{locales.prohibitedActionsAndStatements.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>{locales.prohibitedActionsAndStatements.subline}</p>
        <ul className="list-disc list-inside pl-4">
          {locales.prohibitedActionsAndStatements.actionsAndStatements.map(
            (actionsAndStatements, index) => (
              <li key={index}>{actionsAndStatements}</li>
            )
          )}
        </ul>
      </div>

      <h2>{locales.abuseReport.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            insertParametersIntoLocale(locales.abuseReport.scope.title, {
              supportMail: ENV.SUPPORT_MAIL,
            }),
            [
              <span
                key="highlight-enumeration-10-1"
                className="font-semibold"
              />,
              <TextButton
                key="abuse-report-support-mail"
                as="link"
                to={`mailto:${ENV.SUPPORT_MAIL}`}
                className="inline-flex"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.abuseReport.relevantInformation.title,
            [
              <span
                key="highlight-enumeration-10-2"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <ul className="list-disc list-inside pl-4">
          {locales.abuseReport.relevantInformation.information.map(
            (info, index) => (
              <li key={index}>{info}</li>
            )
          )}
        </ul>
        <p>
          {insertComponentsIntoLocale(locales.abuseReport.processing.title, [
            <span key="highlight-enumeration-10-3" className="font-bold" />,
          ])}
        </p>
      </div>

      <h2>{locales.grantingOfRights.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.grantingOfRights.freeOfCharge.title,
            [
              <span
                key="highlight-enumeration-11-1"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.grantingOfRights.platformVersion.title,
            [
              <span
                key="highlight-enumeration-11-2"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.grantingOfRights.userGeneratedContent.title,
            [
              <span
                key="highlight-enumeration-11-3"
                className="font-semibold"
              />,
            ]
          )}
        </p>
      </div>

      <h2>{locales.featureChanges.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.featureChanges.obligationToContinueDevelopment.title,
            [
              <span
                key="highlight-enumeration-12-1"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.featureChanges.functionalChanges.title,
            [
              <span
                key="highlight-enumeration-12-2"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.featureChanges.globalChanges.title,
            [
              <span
                key="highlight-enumeration-12-3"
                className="font-semibold"
              />,
            ]
          )}
        </p>
      </div>

      <h2>{locales.liabilityAndWarranty.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.liabilityAndWarranty.liability.title,
            [
              <span
                key="highlight-enumeration-13-1"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.liabilityAndWarranty.warranty.title,
            [
              <span
                key="highlight-enumeration-13-2"
                className="font-semibold"
              />,
            ]
          )}
        </p>
      </div>

      <h2>{locales.changesToTermsAndPlatformAvailability.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.changesToTermsAndPlatformAvailability.changesToTerms.title,
            [
              <span
                key="highlight-enumeration-14-1"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.changesToTermsAndPlatformAvailability.platformAvailability
              .title,
            [
              <span
                key="highlight-enumeration-14-2"
                className="font-semibold"
              />,
            ]
          )}
        </p>
      </div>

      <h2>{locales.privacy.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(locales.privacy.description, [
            <TextButton
              key="mint-vernetzt-community-platform-privacy-policy"
              as="link"
              to="/privacy-policy"
              className="inline-flex"
              target="_blank"
              rel="noreferrer noopener"
            />,
          ])}
        </p>
      </div>

      <h2>{locales.finalProvisions.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.finalProvisions.severabilityClause.title,
            [
              <span
                key="highlight-enumeration-16-1"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.finalProvisions.applicableLaw.title,
            [
              <span
                key="highlight-enumeration-16-2"
                className="font-semibold"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.finalProvisions.legalEntity.title,
            [
              <span
                key="highlight-enumeration-16-3"
                className="font-semibold"
              />,
            ]
          )}
        </p>
      </div>
    </section>
  );
}
