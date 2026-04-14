import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { useEffect, useState } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router";
import { Checkbox } from "~/components-next/Checkbox";
import { detectLanguage } from "~/i18n.server";
import {
  insertComponentsIntoLocale,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["privacy-policy"];
  return {
    locales,
  };
};

export default function PrivacyPolicy() {
  const { locales } = useLoaderData<typeof loader>();
  const [isOptedOutOfMatomo, setIsOptedOutOfMatomo] = useState(false);

  useEffect(() => {
    try {
      const _paq = (window._paq = window._paq || []);
      _paq.push([
        // @ts-expect-error - Matomo docs mention that this works. https://developer.matomo.org/guides/tracking-javascript-guide
        function () {
          // @ts-expect-error
          setIsOptedOutOfMatomo(this.isUserOptedOut());
        },
      ]);
    } catch (error) {
      console.warn(`Matomo Opt-Out initialization failed.`);
      const formData = new FormData();
      formData.append(
        "error",
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
      void fetch("/error", {
        method: "POST",
        body: formData,
      });
    }
  }, []);

  return (
    <section className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl mt-8 mb-20">
      <h1>{locales.title}</h1>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>{locales.intro.description}</p>
        <p>{locales.intro.targetGroups}</p>
        <p>{locales.intro.dataProcessing}</p>
        <p>{locales.intro.dataProcessors.prefix}</p>
        <ul className="list-disc list-inside pl-4">
          {locales.intro.dataProcessors.organizations.map(
            (organization, index) => (
              <li key={index}>{organization}</li>
            )
          )}
        </ul>
        <p>{locales.intro.dataProcessors.suffix}</p>
      </div>

      <h2>{locales.contactDataProtectionOfficer.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>{locales.contactDataProtectionOfficer.description}</p>
        <address className="not-italic pl-4">
          <p>{locales.contactDataProtectionOfficer.contactInformation.name}</p>
          <p>
            {locales.contactDataProtectionOfficer.contactInformation.street}
          </p>
          <p>
            {locales.contactDataProtectionOfficer.contactInformation.addition}
          </p>
          <p>
            {
              locales.contactDataProtectionOfficer.contactInformation
                .zipCodeAndCity
            }
          </p>
          <p>
            {insertComponentsIntoLocale(
              insertParametersIntoLocale(
                locales.contactDataProtectionOfficer.contactInformation.phone,
                {
                  phone: "+49 (0) 211 – 75707910",
                }
              ),
              [
                <TextButton
                  key="data-protection-officer-phone"
                  as="link"
                  to="tel:+4921175707910"
                  className="inline-flex"
                />,
              ]
            )}
          </p>
          <p>
            {insertComponentsIntoLocale(
              insertParametersIntoLocale(
                locales.contactDataProtectionOfficer.contactInformation.email,
                {
                  email: "info@matrix-ggmbh.de",
                }
              ),
              [
                <TextButton
                  key="data-protection-officer-email"
                  as="link"
                  to="mailto:info@matrix-ggmbh.de"
                  className="inline-flex"
                />,
              ]
            )}
          </p>
        </address>
        <p>
          {insertComponentsIntoLocale(
            insertParametersIntoLocale(
              locales.contactDataProtectionOfficer.howToContact,
              {
                email: "datenschutz.matrix@uimc.de",
              }
            ),
            [
              <TextButton
                key="data-protection-officer-email-uimc"
                as="link"
                to="mailto:datenschutz.matrix@uimc.de"
                className="inline-flex"
              />,
            ]
          )}
        </p>
      </div>

      <h2>{locales.general.title}</h2>
      <h3>{locales.general.cookies.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        {locales.general.cookies.explanation.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <h3>{locales.general.thirdCountryDataTransfer.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.general.thirdCountryDataTransfer.explanation.prefix,
            [
              <TextButton
                key="dpf-link"
                as="link"
                to="https://www.dataprivacyframework.gov/s/participant-search"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              />,
            ]
          )}
        </p>
        <ul className="list-disc list-inside pl-4">
          {locales.general.thirdCountryDataTransfer.explanation.conditions.map(
            (condition, index) => (
              <li key={index}>{condition}</li>
            )
          )}
        </ul>
        {locales.general.thirdCountryDataTransfer.explanation.suffix.map(
          (paragraph, index) => (
            <p key={index}>{paragraph}</p>
          )
        )}
      </div>

      <h2>{locales.individualProcessingSteps.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>{locales.individualProcessingSteps.subline}</p>
      </div>

      <h3>{locales.individualProcessingSteps.accessAndUse.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>{locales.individualProcessingSteps.accessAndUse.intro}</p>
        <ul className="list-disc list-inside pl-4">
          {locales.individualProcessingSteps.accessAndUse.trackedData.map(
            (trackedData, index) => (
              <li key={index}>{trackedData}</li>
            )
          )}
        </ul>
      </div>

      <h4>{locales.individualProcessingSteps.accessAndUse.purposes.title}</h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {locales.individualProcessingSteps.accessAndUse.purposes.description}
        </p>
      </div>

      <h4>{locales.individualProcessingSteps.accessAndUse.legalBasis.title}</h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.accessAndUse.legalBasis
              .description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.accessAndUse.dataRecipients.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.accessAndUse.dataRecipients
              .description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.accessAndUse
            .thirdCountryDataTransfer.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.accessAndUse
              .thirdCountryDataTransfer.description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.accessAndUse.dataRetention.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.accessAndUse.dataRetention
              .description
          }
        </p>
      </div>

      <h3>
        {
          locales.individualProcessingSteps.registrationAndProfileManagement
            .title
        }
      </h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .subline
          }
        </p>
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .mandatoryData.prefix
          }
        </p>
        <ul className="list-disc list-inside pl-4">
          {locales.individualProcessingSteps.registrationAndProfileManagement.mandatoryData.data.map(
            (data, index) => (
              <li key={index}>{data}</li>
            )
          )}
        </ul>
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .doubleOptIn
          }
        </p>
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .optionalData.prefix
          }
        </p>
        <ul className="list-disc list-inside pl-4">
          {locales.individualProcessingSteps.registrationAndProfileManagement.optionalData.data.map(
            (data, index) => (
              <li key={index}>{data}</li>
            )
          )}
        </ul>
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .changeProfile
          }
        </p>
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .dataUsageByUs
          }
        </p>
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .dataUsageByOtherUsers
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndProfileManagement
            .purposes.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .purposes.description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndProfileManagement
            .legalBasis.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .legalBasis.description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndProfileManagement
            .dataRetention.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .dataRetention.description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndProfileManagement
            .specialNotes.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.registrationAndProfileManagement
              .specialNotes.description
          }
        </p>
      </div>

      <h3>
        {
          locales.individualProcessingSteps.registrationAndParticipationInEvents
            .title
        }
      </h3>
      {locales.individualProcessingSteps.registrationAndParticipationInEvents.description.map(
        (paragraph, index) => (
          <p key={index}>{paragraph}</p>
        )
      )}

      <h4>
        {
          locales.individualProcessingSteps.registrationAndParticipationInEvents
            .purposes.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps
              .registrationAndParticipationInEvents.purposes.description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndParticipationInEvents
            .legalBasis.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps
              .registrationAndParticipationInEvents.legalBasis.description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndParticipationInEvents
            .dataRecipients.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        {locales.individualProcessingSteps.registrationAndParticipationInEvents.dataRecipients.description.map(
          (paragraph, index) => (
            <p key={index}>{paragraph}</p>
          )
        )}
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndParticipationInEvents
            .thirdCountryDataTransfer.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps
              .registrationAndParticipationInEvents.thirdCountryDataTransfer
              .description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.registrationAndParticipationInEvents
            .dataRetention.title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps
              .registrationAndParticipationInEvents.dataRetention.description
          }
        </p>
      </div>

      <h3>{locales.individualProcessingSteps.videoEmbedding.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            locales.individualProcessingSteps.videoEmbedding.subline,
            [
              <TextButton
                key="mintvernetzt-privacy-policy"
                as="link"
                to="https://www.mint-vernetzt.de/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              />,
            ]
          )}
        </p>
        <p>
          {insertComponentsIntoLocale(
            locales.individualProcessingSteps.videoEmbedding.description,
            [
              <TextButton
                key="youtube-extended-privacy"
                as="link"
                to="https://support.google.com/youtube/answer/171780?hl=de#zippy=%2Cerweiterten-datenschutzmodus-aktivieren"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              />,
            ]
          )}
        </p>
      </div>

      <h4>{locales.individualProcessingSteps.videoEmbedding.purposes.title}</h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.videoEmbedding.purposes
              .description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.videoEmbedding.legalBasis.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.videoEmbedding.legalBasis
              .description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.videoEmbedding.dataRecipients.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.videoEmbedding.dataRecipients
              .description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.videoEmbedding.dataRetention.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.videoEmbedding.dataRetention
              .description
          }
        </p>
      </div>

      <h3>{locales.individualProcessingSteps.emailNotifications.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {locales.individualProcessingSteps.emailNotifications.description}
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.emailNotifications.purposes.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.emailNotifications.purposes
              .description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.emailNotifications.legalBasis.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.emailNotifications.legalBasis
              .description
          }
        </p>
      </div>

      <h4>
        {
          locales.individualProcessingSteps.emailNotifications.dataRetention
            .title
        }
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.emailNotifications.dataRetention
              .description
          }
        </p>
      </div>

      <h3>{locales.individualProcessingSteps.contactSupport.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            insertParametersIntoLocale(
              locales.individualProcessingSteps.contactSupport.description,
              {
                supportMail: ENV.SUPPORT_MAIL,
              }
            ),
            [
              <TextButton
                key="support-mail"
                as="link"
                to={`mailto:${ENV.SUPPORT_MAIL}`}
                className="inline-flex"
              />,
            ]
          )}
        </p>
      </div>

      <h4>{locales.individualProcessingSteps.contactSupport.purposes.title}</h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.contactSupport.purposes
              .description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.contactSupport.legalBasis.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.contactSupport.legalBasis
              .description
          }
        </p>
      </div>

      <h4>
        {locales.individualProcessingSteps.contactSupport.dataRetention.title}
      </h4>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.individualProcessingSteps.contactSupport.dataRetention
              .description
          }
        </p>
      </div>

      <h3>{locales.individualProcessingSteps.matomo.title}</h3>
      {ENV.MATOMO_URL !== "" ? (
        <>
          <div className="w-full flex flex-col gap-2 mb-4">
            <p>{locales.individualProcessingSteps.matomo.prefix}</p>
            <ul className="list-disc list-inside pl-4">
              {locales.individualProcessingSteps.matomo.trackedData.map(
                (trackedData, index) => (
                  <li key={index}>{trackedData}</li>
                )
              )}
            </ul>
            <p>{locales.individualProcessingSteps.matomo.suffix}</p>
          </div>

          <h4>{locales.individualProcessingSteps.matomo.purposes.title}</h4>
          <div className="w-full flex flex-col gap-2 mb-4">
            <p>
              {locales.individualProcessingSteps.matomo.purposes.description}
            </p>
          </div>

          <h4>{locales.individualProcessingSteps.matomo.legalBasis.title}</h4>
          <div className="w-full flex flex-col gap-2 mb-4">
            <p>
              {locales.individualProcessingSteps.matomo.legalBasis.description}
            </p>
          </div>

          <h4>
            {locales.individualProcessingSteps.matomo.dataRecipients.title}
          </h4>
          <div className="w-full flex flex-col gap-2 mb-4">
            <p>
              {
                locales.individualProcessingSteps.matomo.dataRecipients
                  .description
              }
            </p>
          </div>

          <h4>
            {
              locales.individualProcessingSteps.matomo.thirdCountryDataTransfer
                .title
            }
          </h4>
          <div className="w-full flex flex-col gap-2 mb-4">
            <p>
              {
                locales.individualProcessingSteps.matomo
                  .thirdCountryDataTransfer.description
              }
            </p>
          </div>

          <h4>
            {locales.individualProcessingSteps.matomo.dataRetention.title}
          </h4>
          <div className="w-full flex flex-col gap-2 mb-4">
            <p>
              {
                locales.individualProcessingSteps.matomo.dataRetention
                  .description
              }
            </p>
          </div>

          <h4>{locales.individualProcessingSteps.matomo.optOut.title}</h4>
          <div className="w-full flex flex-col gap-2 mb-4">
            <div className="w-fit flex gap-2 items-center">
              <Checkbox
                id="matomo-opt-out"
                type="checkbox"
                checked={!isOptedOutOfMatomo}
                onChange={(e) => {
                  const isChecked = !e.target.checked;
                  setIsOptedOutOfMatomo(isChecked);
                  const _paq = (window._paq = window._paq || []);
                  try {
                    if (isChecked === false) {
                      _paq.push(["forgetUserOptOut"]);
                    } else {
                      window._paq.push(["optUserOut"]);
                    }
                  } catch (error) {
                    console.warn(`Matomo Opt-Out trigger failed.`);
                    const formData = new FormData();
                    formData.append(
                      "error",
                      JSON.stringify(error, Object.getOwnPropertyNames(error))
                    );
                    void fetch("/error", {
                      method: "POST",
                      body: formData,
                    });
                  }
                }}
              />
              <label htmlFor="matomo-opt-out" className="cursor-pointer">
                {isOptedOutOfMatomo
                  ? locales.individualProcessingSteps.matomo.optOut
                      .trackerInactive
                  : locales.individualProcessingSteps.matomo.optOut
                      .trackerActive}
              </label>
            </div>
          </div>
        </>
      ) : (
        <p className="mb-4">
          {locales.individualProcessingSteps.matomo.matomoNotConfigured}
        </p>
      )}

      <h2>{locales.rightsOfAffectedIndividuals.title}</h2>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>{locales.rightsOfAffectedIndividuals.intro}</p>
        <address className="not-italic pl-4">
          <p>{locales.rightsOfAffectedIndividuals.contactInformation.name}</p>
          <p>{locales.rightsOfAffectedIndividuals.contactInformation.street}</p>
          <p>
            {locales.rightsOfAffectedIndividuals.contactInformation.addition}
          </p>
          <p>
            {
              locales.rightsOfAffectedIndividuals.contactInformation
                .zipCodeAndCity
            }
          </p>
          <p>
            {insertComponentsIntoLocale(
              insertParametersIntoLocale(
                locales.rightsOfAffectedIndividuals.contactInformation.phone,
                {
                  phone: "+49 (0) 211 – 75707910",
                }
              ),
              [
                <TextButton
                  key="data-protection-officer-phone-2"
                  as="link"
                  to="tel:+4921175707910"
                  className="inline-flex"
                />,
              ]
            )}
          </p>
          <p>
            {insertComponentsIntoLocale(
              insertParametersIntoLocale(
                locales.rightsOfAffectedIndividuals.contactInformation.email,
                {
                  email: "info@matrix-ggmbh.de",
                }
              ),
              [
                <TextButton
                  key="data-protection-officer-email-2"
                  as="link"
                  to="mailto:info@matrix-ggmbh.de"
                  className="inline-flex"
                />,
              ]
            )}
          </p>
        </address>
        <p>{locales.rightsOfAffectedIndividuals.rights.prefix}</p>
      </div>

      <h3>{locales.rightsOfAffectedIndividuals.rights.information.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {locales.rightsOfAffectedIndividuals.rights.information.description}
        </p>
        <ul className="list-disc list-inside pl-4">
          {locales.rightsOfAffectedIndividuals.rights.information.data.map(
            (data, index) => (
              <li key={index}>{data}</li>
            )
          )}
        </ul>
      </div>

      <h3>{locales.rightsOfAffectedIndividuals.rights.correction.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {locales.rightsOfAffectedIndividuals.rights.correction.description}
        </p>
      </div>

      <h3>{locales.rightsOfAffectedIndividuals.rights.deletion.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        {locales.rightsOfAffectedIndividuals.rights.deletion.description.map(
          (paragraph, index) => (
            <p key={index}>{paragraph}</p>
          )
        )}
      </div>

      <h3>{locales.rightsOfAffectedIndividuals.rights.restriction.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {locales.rightsOfAffectedIndividuals.rights.restriction.description}
        </p>
      </div>

      <h3>
        {locales.rightsOfAffectedIndividuals.rights.dataPortability.title}
      </h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.rightsOfAffectedIndividuals.rights.dataPortability
              .description
          }
        </p>
      </div>

      <h3>
        {locales.rightsOfAffectedIndividuals.rights.withdrawalOfConsent.title}
      </h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.rightsOfAffectedIndividuals.rights.withdrawalOfConsent
              .description
          }
        </p>
      </div>

      <h3>
        {
          locales.rightsOfAffectedIndividuals.rights
            .complaintToARegulatoryAuthority.title
        }
      </h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {
            locales.rightsOfAffectedIndividuals.rights
              .complaintToARegulatoryAuthority.description
          }
        </p>
      </div>

      <h3>{locales.rightsOfAffectedIndividuals.rights.objection.title}</h3>
      <div className="w-full flex flex-col gap-2 mb-4">
        <p>
          {insertComponentsIntoLocale(
            insertParametersIntoLocale(
              locales.rightsOfAffectedIndividuals.rights.objection.description,
              {
                email: "info@matrix-ggmbh.de",
              }
            ),
            [
              <TextButton
                key="data-protection-officer-email-3"
                as="link"
                to="mailto:info@matrix-ggmbh.de"
                className="inline-flex"
              />,
            ]
          )}
        </p>
      </div>
    </section>
  );
}
