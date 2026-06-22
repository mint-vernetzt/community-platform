/* de */
// components
import { locale as deImageCropper } from "./de/components/image-cropper";
import { locale as deRTE } from "./de/components/rte";
// datasets
import { locale as deAdditionalDisciplines } from "./de/datasets/additionalDisciplines";
import { locale as deDisciplines } from "./de/datasets/disciplines";
import { locale as deEventAbuseReportReasonSuggestions } from "./de/datasets/eventAbuseReportReasonSuggestions";
import { locale as deEventTargetGroups } from "./de/datasets/eventTargetGroups";
import { locale as deEventTypes } from "./de/datasets/eventTypes";
import { locale as deExperienceLevels } from "./de/datasets/experienceLevels";
import { locale as deFinancings } from "./de/datasets/financings";
import { locale as deFocuses } from "./de/datasets/focuses";
import { locale as deFormats } from "./de/datasets/formats";
import { locale as deNetworkTypes } from "./de/datasets/networkTypes";
import { locale as deOffers } from "./de/datasets/offers";
import { locale as deOrganizationTypes } from "./de/datasets/organizationTypes";
import { locale as deProjectTargetGroups } from "./de/datasets/projectTargetGroups";
import { locale as deSpecialTargetGroups } from "./de/datasets/specialTargetGroups";
import { locale as deStages } from "./de/datasets/stages";
import { locale as deTags } from "./de/datasets/tags";
// organisms
import { locale as deEventCard } from "./de/organisms/cards/event-card";
import { locale as deOrganizationCard } from "./de/organisms/cards/organization-card";
import { locale as deProfileCard } from "./de/organisms/cards/profile-card";
import { locale as deProjectCard } from "./de/organisms/cards/project-card";
import { locale as deFooter } from "./de/organisms/footer";
import { locale as deRoadmap } from "./de/organisms/roadmap";
import { locale as deVideo } from "./de/organisms/video";
// auth routes
import { locale as deConfirmAuthAction } from "./de/routes/auth/confirm";
import { locale as deRequestConfirmation } from "./de/routes/auth/request-confirmation";
import { locale as deVerify } from "./de/routes/auth/verify";
import { locale as deKeycloakCallback } from "./de/routes/auth/keycloak.callback";
// event routes
import { locale as deEventDetail } from "./de/routes/event/$slug/detail";
import { locale as deAboutEvent } from "./de/routes/event/$slug/detail/about";
import { locale as deEventParticipants } from "./de/routes/event/$slug/detail/participants";
import { locale as deChildEvents } from "./de/routes/event/$slug/detail/child-events";
import { locale as deDownloadEventDocuments } from "./de/routes/event/$slug/documents-download";
// next event routes
import { locale as deCreateEvent } from "./de/routes/event/create";
import { locale as deEventSettings } from "./de/routes/event/$slug/settings";
import { locale as deEventSettingsAdmins } from "./de/routes/event/$slug/settings/admins";
import { locale as deEventSettingsAdminsList } from "./de/routes/event/$slug/settings/admins/list";
import { locale as deEventSettingsAdminsAdd } from "./de/routes/event/$slug/settings/admins/add";
import { locale as deEventSettingsAdminsInvites } from "./de/routes/event/$slug/settings/admins/invites";
import { locale as deEventSettingsDangerZone } from "./de/routes/event/$slug/settings/danger-zone";
import { locale as deEventSettingsChangeURL } from "./de/routes/event/$slug/settings/danger-zone/change-url";
import { locale as deEventSettingsCancel } from "./de/routes/event/$slug/settings/danger-zone/cancel";
import { locale as deEventSettingsDelete } from "./de/routes/event/$slug/settings/danger-zone/delete";
import { locale as deEventSettingsDetails } from "./de/routes/event/$slug/settings/details";
import { locale as deEventSettingsDetailsInfo } from "./de/routes/event/$slug/settings/details/info";
import { locale as deEventSettingsDetailsBackground } from "./de/routes/event/$slug/settings/details/background";
import { locale as deEventSettingsDocuments } from "./de/routes/event/$slug/settings/documents";
import { locale as deEventSettingsDocumentsList } from "./de/routes/event/$slug/settings/documents/list";
import { locale as deEventSettingsDocumentsAdd } from "./de/routes/event/$slug/settings/documents/add";
import { locale as deEventSettingsLocation } from "./de/routes/event/$slug/settings/location";
import { locale as deEventSettingsParticipants } from "./de/routes/event/$slug/settings/participants";
import { locale as deEventSettingsParticipantsList } from "./de/routes/event/$slug/settings/participants/list";
import { locale as deEventSettingsParticipantsWaitingList } from "./de/routes/event/$slug/settings/participants/waiting-list";
import { locale as deEventSettingsParticipantsAdd } from "./de/routes/event/$slug/settings/participants/add";
import { locale as deEventSettingsParticipantsInvites } from "./de/routes/event/$slug/settings/participants/invites";
import { locale as deEventSettingsRegistration } from "./de/routes/event/$slug/settings/registration";
import { locale as deEventSettingsRegistrationAccess } from "./de/routes/event/$slug/settings/registration/access";
import { locale as deEventSettingsRegistrationPeriod } from "./de/routes/event/$slug/settings/registration/period";
import { locale as deEventSettingsRegistrationLimit } from "./de/routes/event/$slug/settings/registration/limit";
import { locale as deEventSettingsRelatedEvents } from "./de/routes/event/$slug/settings/related-events";
import { locale as deEventSettingsRelatedEventsParentEvent } from "./de/routes/event/$slug/settings/related-events/parent-event";
import { locale as deEventSettingsRelatedEventsChildEvents } from "./de/routes/event/$slug/settings/related-events/child-events";
import { locale as deEventSettingsResponsibleOrgs } from "./de/routes/event/$slug/settings/responsible-orgs";
import { locale as deEventSettingsResponsibleOrgsList } from "./de/routes/event/$slug/settings/responsible-orgs/list";
import { locale as deEventSettingsResponsibleOrgsAdd } from "./de/routes/event/$slug/settings/responsible-orgs/add";
import { locale as deEventSettingsResponsibleOrgsInvites } from "./de/routes/event/$slug/settings/responsible-orgs/invites";
import { locale as deEventSettingsSpeakers } from "./de/routes/event/$slug/settings/speakers";
import { locale as deEventSettingsSpeakersList } from "./de/routes/event/$slug/settings/speakers/list";
import { locale as deEventSettingsSpeakersAdd } from "./de/routes/event/$slug/settings/speakers/add";
import { locale as deEventSettingsSpeakersInvites } from "./de/routes/event/$slug/settings/speakers/invites";
import { locale as deEventSettingsTeam } from "./de/routes/event/$slug/settings/team";
import { locale as deEventSettingsTeamList } from "./de/routes/event/$slug/settings/team/list";
import { locale as deEventSettingsTeamAdd } from "./de/routes/event/$slug/settings/team/add";
import { locale as deEventSettingsTeamInvites } from "./de/routes/event/$slug/settings/team/invites";
import { locale as deEventSettingsTimePeriod } from "./de/routes/event/$slug/settings/time-period";
// explore routes
import { locale as deExplore } from "./de/routes/explore";
import { locale as deExploreIndex } from "./de/routes/explore/index";
import { locale as deExploreEvents } from "./de/routes/explore/events";
import { locale as deExploreFundings } from "./de/routes/explore/fundings";
import { locale as deExploreOrganizations } from "./de/routes/explore/organizations";
import { locale as deExploreProfiles } from "./de/routes/explore/profiles";
import { locale as deExploreProjects } from "./de/routes/explore/projects";
// login routes
import { locale as deLogin } from "./de/routes/login/index";
// my routes
import { locale as deMyEvents } from "./de/routes/my/events";
import { locale as deMyOrganizations } from "./de/routes/my/organizations";
import { locale as deMyProjects } from "./de/routes/my/projects";
// organization routes
import { locale as deCreateOrganization } from "./de/routes/organization/create";
import { locale as deOrganizationDetail } from "./de/routes/organization/$slug/detail";
import { locale as deOrganizationTeam } from "./de/routes/organization/$slug/detail/team";
import { locale as deAboutOrganization } from "./de/routes/organization/$slug/detail/about";
import { locale as deOrganizationEvents } from "./de/routes/organization/$slug/detail/events";
import { locale as deOrganizationNetwork } from "./de/routes/organization/$slug/detail/network";
import { locale as deOrganizationProjects } from "./de/routes/organization/$slug/detail/projects";
import { locale as deOrganizationSettings } from "./de/routes/organization/$slug/settings";
import { locale as deChangeOrganizationUrl } from "./de/routes/organization/$slug/settings/danger-zone/change-url";
import { locale as deDeleteOrganization } from "./de/routes/organization/$slug/settings/danger-zone/delete";
import { locale as deOrganizationAdmins } from "./de/routes/organization/$slug/settings/admins";
import { locale as deOrganizationDangerZone } from "./de/routes/organization/$slug/settings/danger-zone";
import { locale as deGeneralOrganizationSettings } from "./de/routes/organization/$slug/settings/general";
import { locale as deManageOrganizationSettings } from "./de/routes/organization/$slug/settings/manage";
import { locale as deOrganizationTeamSettings } from "./de/routes/organization/$slug/settings/team";
import { locale as deOrganizationWebAndSocial } from "./de/routes/organization/$slug/settings/web-social";
// profile routes
import { locale as deDeleteProfile } from "./de/routes/profile/$username/settings/delete";
import { locale as deGeneralProfileSettings } from "./de/routes/profile/$username/settings/general";
import { locale as deProfileNotifications } from "./de/routes/profile/$username/settings/notifications";
import { locale as deProfileSecurity } from "./de/routes/profile/$username/settings/security";
import { locale as deProfileDetail } from "./de/routes/profile/$username/index";
import { locale as deProfileSettings } from "./de/routes/profile/$username/settings";
// project routes
import { locale as deDownloadProjectAttachments } from "./de/routes/project/$slug/detail/attachments/download";
import { locale as deAboutProject } from "./de/routes/project/$slug/detail/about";
import { locale as deProjectAttachments } from "./de/routes/project/$slug/detail/attachments";
import { locale as deProjectRequirements } from "./de/routes/project/$slug/detail/requirements";
import { locale as deDownloadProjectAttachmentsFromSettings } from "./de/routes/project/$slug/settings/attachments/download";
import { locale as deChangeProjectUrl } from "./de/routes/project/$slug/settings/danger-zone/change-url";
import { locale as deDeleteProject } from "./de/routes/project/$slug/settings/danger-zone/delete";
import { locale as deProjectAdmins } from "./de/routes/project/$slug/settings/admins";
import { locale as deProjectAttachmentsSettings } from "./de/routes/project/$slug/settings/attachments";
import { locale as deProjectDangerZone } from "./de/routes/project/$slug/settings/danger-zone";
import { locale as deProjectDetails } from "./de/routes/project/$slug/settings/details";
import { locale as deGeneralProjectSettings } from "./de/routes/project/$slug/settings/general";
import { locale as deProjectSettingsIndex } from "./de/routes/project/$slug/settings/index";
import { locale as deProjectRequirementsSettings } from "./de/routes/project/$slug/settings/requirements";
import { locale as deResponsibleOrganizationsOfProject } from "./de/routes/project/$slug/settings/responsible-orgs";
import { locale as deProjectTeam } from "./de/routes/project/$slug/settings/team";
import { locale as deProjectWebAndSocial } from "./de/routes/project/$slug/settings/web-social";
import { locale as deProjectDetail } from "./de/routes/project/$slug/detail";
import { locale as deProjectSettings } from "./de/routes/project/$slug/settings";
import { locale as deCreateProject } from "./de/routes/project/create";
// register routes
import { locale as deRegister } from "./de/routes/register/index";
// reset credentials routes
import { locale as deResetPassword } from "./de/routes/reset/index";
import { locale as deSetNewPassword } from "./de/routes/reset/set-password";
// accept terms route
import { locale as deAcceptTerms } from "./de/routes/accept-terms";
// accessibility-statement route
import { locale as deAccessibilityStatement } from "./de/routes/accessibility-statement";
// dashboard route
import { locale as deDashboard } from "./de/routes/dashboard";
// goodbye route
import { locale as deGoodbye } from "./de/routes/goodbye";
// imprint route
import { locale as deImprint } from "./de/routes/imprint";
// landing route
import { locale as deLanding } from "./de/routes/index";
// map route
import { locale as deMap } from "./de/routes/map";
// privacy-policy route
import { locale as dePrivacyPolicy } from "./de/routes/privacy-policy";
// resources route
import { locale as deResources } from "./de/routes/resources";
// terms-of-use route
import { locale as deTermsOfUse } from "./de/routes/terms-of-use";
// splat routes
import { locale as deSplat } from "./de/routes/$";
// schemas
import { locale as deSearchProfilesSchema } from "./de/schemas/searchProfiles";
import { locale as deSearchOrganizationsSchema } from "./de/schemas/searchOrganizations";
// utils
import { locale as deSchemas } from "./de/utils/schemas";
import { locale as deSocialMediaServices } from "./de/utils/social-media-services";
import { locale as deUpload } from "./de/utils/upload";
// components.ts
import { locale as deComponents } from "./de/components";
// help.ts
import { locale as deHelp } from "./de/help";
// meta.ts
import { locale as deMeta } from "./de/meta";

/* en */
// components
import { locale as enImageCropper } from "./en/components/image-cropper";
import { locale as enRTE } from "./en/components/rte";
// datasets
import { locale as enAdditionalDisciplines } from "./en/datasets/additionalDisciplines";
import { locale as enDisciplines } from "./en/datasets/disciplines";
import { locale as enEventAbuseReportReasonSuggestions } from "./en/datasets/eventAbuseReportReasonSuggestions";
import { locale as enEventTargetGroups } from "./en/datasets/eventTargetGroups";
import { locale as enEventTypes } from "./en/datasets/eventTypes";
import { locale as enExperienceLevels } from "./en/datasets/experienceLevels";
import { locale as enFinancings } from "./en/datasets/financings";
import { locale as enFocuses } from "./en/datasets/focuses";
import { locale as enFormats } from "./en/datasets/formats";
import { locale as enNetworkTypes } from "./en/datasets/networkTypes";
import { locale as enOffers } from "./en/datasets/offers";
import { locale as enOrganizationTypes } from "./en/datasets/organizationTypes";
import { locale as enProjectTargetGroups } from "./en/datasets/projectTargetGroups";
import { locale as enSpecialTargetGroups } from "./en/datasets/specialTargetGroups";
import { locale as enStages } from "./en/datasets/stages";
import { locale as enTags } from "./en/datasets/tags";
// organisms
import { locale as enEventCard } from "./en/organisms/cards/event-card";
import { locale as enOrganizationCard } from "./en/organisms/cards/organization-card";
import { locale as enProfileCard } from "./en/organisms/cards/profile-card";
import { locale as enProjectCard } from "./en/organisms/cards/project-card";
import { locale as enFooter } from "./en/organisms/footer";
import { locale as enRoadmap } from "./en/organisms/roadmap";
import { locale as enVideo } from "./en/organisms/video";
// auth routes
import { locale as enConfirmAuthAction } from "./en/routes/auth/confirm";
import { locale as enRequestConfirmation } from "./en/routes/auth/request-confirmation";
import { locale as enVerify } from "./en/routes/auth/verify";
import { locale as enKeycloakCallback } from "./en/routes/auth/keycloak.callback";
// event routes
import { locale as enEventDetail } from "./en/routes/event/$slug/detail";
import { locale as enAboutEvent } from "./en/routes/event/$slug/detail/about";
import { locale as enEventParticipants } from "./en/routes/event/$slug/detail/participants";
import { locale as enChildEvents } from "./en/routes/event/$slug/detail/child-events";
import { locale as enDownloadEventDocuments } from "./en/routes/event/$slug/documents-download";
// next event routes
import { locale as enCreateEvent } from "./en/routes/event/create";
import { locale as enEventSettings } from "./en/routes/event/$slug/settings";
import { locale as enEventSettingsAdmins } from "./en/routes/event/$slug/settings/admins";
import { locale as enEventSettingsAdminsList } from "./en/routes/event/$slug/settings/admins/list";
import { locale as enEventSettingsAdminsAdd } from "./en/routes/event/$slug/settings/admins/add";
import { locale as enEventSettingsAdminsInvites } from "./en/routes/event/$slug/settings/admins/invites";
import { locale as enEventSettingsDangerZone } from "./en/routes/event/$slug/settings/danger-zone";
import { locale as enEventSettingsChangeURL } from "./en/routes/event/$slug/settings/danger-zone/change-url";
import { locale as enEventSettingsCancel } from "./en/routes/event/$slug/settings/danger-zone/cancel";
import { locale as enEventSettingsDelete } from "./en/routes/event/$slug/settings/danger-zone/delete";
import { locale as enEventSettingsDetails } from "./en/routes/event/$slug/settings/details";
import { locale as enEventSettingsDetailsInfo } from "./en/routes/event/$slug/settings/details/info";
import { locale as enEventSettingsDetailsBackground } from "./en/routes/event/$slug/settings/details/background";
import { locale as enEventSettingsDocuments } from "./en/routes/event/$slug/settings/documents";
import { locale as enEventSettingsDocumentsList } from "./en/routes/event/$slug/settings/documents/list";
import { locale as enEventSettingsDocumentsAdd } from "./en/routes/event/$slug/settings/documents/add";
import { locale as enEventSettingsLocation } from "./en/routes/event/$slug/settings/location";
import { locale as enEventSettingsParticipants } from "./en/routes/event/$slug/settings/participants";
import { locale as enEventSettingsParticipantsList } from "./en/routes/event/$slug/settings/participants/list";
import { locale as enEventSettingsParticipantsWaitingList } from "./en/routes/event/$slug/settings/participants/waiting-list";
import { locale as enEventSettingsParticipantsAdd } from "./en/routes/event/$slug/settings/participants/add";
import { locale as enEventSettingsParticipantsInvites } from "./en/routes/event/$slug/settings/participants/invites";
import { locale as enEventSettingsRegistration } from "./en/routes/event/$slug/settings/registration";
import { locale as enEventSettingsRegistrationAccess } from "./en/routes/event/$slug/settings/registration/access";
import { locale as enEventSettingsRegistrationPeriod } from "./en/routes/event/$slug/settings/registration/period";
import { locale as enEventSettingsRegistrationLimit } from "./en/routes/event/$slug/settings/registration/limit";
import { locale as enEventSettingsRelatedEvents } from "./en/routes/event/$slug/settings/related-events";
import { locale as enEventSettingsRelatedEventsParentEvent } from "./en/routes/event/$slug/settings/related-events/parent-event";
import { locale as enEventSettingsRelatedEventsChildEvents } from "./en/routes/event/$slug/settings/related-events/child-events";
import { locale as enEventSettingsResponsibleOrgs } from "./en/routes/event/$slug/settings/responsible-orgs";
import { locale as enEventSettingsResponsibleOrgsList } from "./en/routes/event/$slug/settings/responsible-orgs/list";
import { locale as enEventSettingsResponsibleOrgsAdd } from "./en/routes/event/$slug/settings/responsible-orgs/add";
import { locale as enEventSettingsResponsibleOrgsInvites } from "./en/routes/event/$slug/settings/responsible-orgs/invites";
import { locale as enEventSettingsSpeakers } from "./en/routes/event/$slug/settings/speakers";
import { locale as enEventSettingsSpeakersList } from "./en/routes/event/$slug/settings/speakers/list";
import { locale as enEventSettingsSpeakersAdd } from "./en/routes/event/$slug/settings/speakers/add";
import { locale as enEventSettingsSpeakersInvites } from "./en/routes/event/$slug/settings/speakers/invites";
import { locale as enEventSettingsTeam } from "./en/routes/event/$slug/settings/team";
import { locale as enEventSettingsTeamList } from "./en/routes/event/$slug/settings/team/list";
import { locale as enEventSettingsTeamAdd } from "./en/routes/event/$slug/settings/team/add";
import { locale as enEventSettingsTeamInvites } from "./en/routes/event/$slug/settings/team/invites";
import { locale as enEventSettingsTimePeriod } from "./en/routes/event/$slug/settings/time-period";
// explore routes
import { locale as enExplore } from "./en/routes/explore";
import { locale as enExploreIndex } from "./en/routes/explore/index";
import { locale as enExploreEvents } from "./en/routes/explore/events";
import { locale as enExploreFundings } from "./en/routes/explore/fundings";
import { locale as enExploreOrganizations } from "./en/routes/explore/organizations";
import { locale as enExploreProfiles } from "./en/routes/explore/profiles";
import { locale as enExploreProjects } from "./en/routes/explore/projects";
// login routes
import { locale as enLogin } from "./en/routes/login/index";
// my routes
import { locale as enMyEvents } from "./en/routes/my/events";
import { locale as enMyOrganizations } from "./en/routes/my/organizations";
import { locale as enMyProjects } from "./en/routes/my/projects";
// organization routes
import { locale as enCreateOrganization } from "./en/routes/organization/create";
import { locale as enOrganizationDetail } from "./en/routes/organization/$slug/detail";
import { locale as enAboutOrganization } from "./en/routes/organization/$slug/detail/about";
import { locale as enOrganizationEvents } from "./en/routes/organization/$slug/detail/events";
import { locale as enOrganizationNetwork } from "./en/routes/organization/$slug/detail/network";
import { locale as enOrganizationProjects } from "./en/routes/organization/$slug/detail/projects";
import { locale as enOrganizationTeam } from "./en/routes/organization/$slug/detail/team";
import { locale as enOrganizationSettings } from "./en/routes/organization/$slug/settings";
import { locale as enChangeOrganizationUrl } from "./en/routes/organization/$slug/settings/danger-zone/change-url";
import { locale as enDeleteOrganization } from "./en/routes/organization/$slug/settings/danger-zone/delete";
import { locale as enOrganizationAdmins } from "./en/routes/organization/$slug/settings/admins";
import { locale as enOrganizationDangerZone } from "./en/routes/organization/$slug/settings/danger-zone";
import { locale as enGeneralOrganizationSettings } from "./en/routes/organization/$slug/settings/general";
import { locale as enManageOrganizationSettings } from "./en/routes/organization/$slug/settings/manage";
import { locale as enOrganizationTeamSettings } from "./en/routes/organization/$slug/settings/team";
import { locale as enOrganizationWebAndSocial } from "./en/routes/organization/$slug/settings/web-social";
// profile routes
import { locale as enDeleteProfile } from "./en/routes/profile/$username/settings/delete";
import { locale as enGeneralProfileSettings } from "./en/routes/profile/$username/settings/general";
import { locale as enProfileNotifications } from "./en/routes/profile/$username/settings/notifications";
import { locale as enProfileSecurity } from "./en/routes/profile/$username/settings/security";
import { locale as enProfileDetail } from "./en/routes/profile/$username/index";
import { locale as enProfileSettings } from "./en/routes/profile/$username/settings";
// project routes
import { locale as enDownloadProjectAttachments } from "./en/routes/project/$slug/detail/attachments/download";
import { locale as enAboutProject } from "./en/routes/project/$slug/detail/about";
import { locale as enProjectAttachments } from "./en/routes/project/$slug/detail/attachments";
import { locale as enProjectRequirements } from "./en/routes/project/$slug/detail/requirements";
import { locale as enDownloadProjectAttachmentsFromSettings } from "./en/routes/project/$slug/settings/attachments/download";
import { locale as enChangeProjectUrl } from "./en/routes/project/$slug/settings/danger-zone/change-url";
import { locale as enDeleteProject } from "./en/routes/project/$slug/settings/danger-zone/delete";
import { locale as enProjectAdmins } from "./en/routes/project/$slug/settings/admins";
import { locale as enProjectAttachmentsSettings } from "./en/routes/project/$slug/settings/attachments";
import { locale as enProjectDangerZone } from "./en/routes/project/$slug/settings/danger-zone";
import { locale as enProjectDetails } from "./en/routes/project/$slug/settings/details";
import { locale as enGeneralProjectSettings } from "./en/routes/project/$slug/settings/general";
import { locale as enProjectSettingsIndex } from "./en/routes/project/$slug/settings/index";
import { locale as enProjectRequirementsSettings } from "./en/routes/project/$slug/settings/requirements";
import { locale as enResponsibleOrganizationsOfProject } from "./en/routes/project/$slug/settings/responsible-orgs";
import { locale as enProjectTeam } from "./en/routes/project/$slug/settings/team";
import { locale as enProjectWebAndSocial } from "./en/routes/project/$slug/settings/web-social";
import { locale as enProjectDetail } from "./en/routes/project/$slug/detail";
import { locale as enProjectSettings } from "./en/routes/project/$slug/settings";
import { locale as enCreateProject } from "./en/routes/project/create";
// register routes
import { locale as enRegister } from "./en/routes/register/index";
// reset credentials routes
import { locale as enResetPassword } from "./en/routes/reset/index";
import { locale as enSetNewPassword } from "./en/routes/reset/set-password";
// accept terms route
import { locale as enAcceptTerms } from "./en/routes/accept-terms";
// accessibility-statement route
import { locale as enAccessibilityStatement } from "./en/routes/accessibility-statement";
// dashboard route
import { locale as enDashboard } from "./en/routes/dashboard";
// goodbye route
import { locale as enGoodbye } from "./en/routes/goodbye";
// imprint route
import { locale as enImprint } from "./en/routes/imprint";
// landing route
import { locale as enLanding } from "./en/routes/index";
// map route
import { locale as enMap } from "./en/routes/map";
// privacy-policy route
import { locale as enPrivacyPolicy } from "./en/routes/privacy-policy";
// resources route
import { locale as enResources } from "./en/routes/resources";
// terms-of-use route
import { locale as enTermsOfUse } from "./en/routes/terms-of-use";
// splat routes
import { locale as enSplat } from "./en/routes/$";
// schemas
import { locale as enSearchProfilesSchema } from "./en/schemas/searchProfiles";
import { locale as enSearchOrganizationsSchema } from "./en/schemas/searchOrganizations";
// utils
import { locale as enSchemas } from "./en/utils/schemas";
import { locale as enSocialMediaServices } from "./en/utils/social-media-services";
import { locale as enUpload } from "./en/utils/upload";
// components.ts
import { locale as enComponents } from "./en/components";
// help.ts
import { locale as enHelp } from "./en/help";
// meta
import { locale as enMeta } from "./en/meta";

/**
 * This is the map of all language modules.
 *
 * The key is the language code in combination with the route pathname.
 * The values are fully typed locales from those routes.
 *
 * To add a new language following steps are required:
 *
 * 1. Copy an existing language folder and rename it to the new language code.
 * 2. Translate all files in the new language folder.
 * 3. Add the new language to the `supportedCookieLanguages` array in `i18n.shared.ts`.
 * - Dont panic if all modules have type errors, the next steps fix these.
 * 4. Add the new language to the `supportedHeaderLanguages` array and transform them into a single value inside the schema in `i18n.server.ts`.
 * - Full list: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
 * - Comprehensive list (more grouped): https://www.niefuend.org/blog/internet/2017/10/alle-accept-language-codes-mit-laendernamen/
 * 4. Add the new language modules to the `languageModuleMap` object below. (Copilot can help with this)
 */

const de = {
  // root
  root: { route: deMeta, footer: deFooter },
  // auth routes
  "auth/confirm": deConfirmAuthAction,
  "auth/request-confirmation": deRequestConfirmation,
  "auth/verify": deVerify,
  "auth/keycloak.callback": deKeycloakCallback,
  // event routes
  "event/$slug/documents-download": deDownloadEventDocuments,
  "event/$slug/detail": {
    route: deEventDetail,
    stages: deStages,
    eventAbuseReportReasonSuggestions: deEventAbuseReportReasonSuggestions,
  },
  "event/$slug/detail/about": {
    route: deAboutEvent,
    experienceLevels: deExperienceLevels,
    focuses: deFocuses,
    eventTypes: deEventTypes,
    eventTargetGroups: deEventTargetGroups,
    tags: deTags,
    networkTypes: deNetworkTypes,
    organizationTypes: deOrganizationTypes,
  },
  "event/$slug/detail/participants": {
    route: deEventParticipants,
  },
  "event/$slug/detail/child-events": {
    route: deChildEvents,
    stages: deStages,
  },
  // next event routes
  "event/create": {
    route: deCreateEvent,
    stages: deStages,
  },
  "event/$slug/settings": {
    route: deEventSettings,
  },
  "event/$slug/settings/admins": {
    route: deEventSettingsAdmins,
  },
  "event/$slug/settings/admins/add": {
    route: deEventSettingsAdminsAdd,
  },
  "event/$slug/settings/admins/list": {
    route: deEventSettingsAdminsList,
  },
  "event/$slug/settings/admins/invites": {
    route: deEventSettingsAdminsInvites,
  },
  "event/$slug/settings/danger-zone": {
    route: deEventSettingsDangerZone,
  },
  "event/$slug/settings/danger-zone/change-url": {
    route: deEventSettingsChangeURL,
    components: deComponents,
  },
  "event/$slug/settings/danger-zone/cancel": {
    route: deEventSettingsCancel,
    stages: deStages,
  },
  "event/$slug/settings/danger-zone/delete": {
    route: deEventSettingsDelete,
  },
  "event/$slug/settings/details": {
    route: deEventSettingsDetails,
  },
  "event/$slug/settings/details/info": {
    route: deEventSettingsDetailsInfo,
    types: deEventTypes,
    tags: deTags,
    eventTargetGroups: deEventTargetGroups,
    experienceLevels: deExperienceLevels,
    focuses: deFocuses,
    components: deComponents,
    rte: deRTE,
  },
  "event/$slug/settings/details/background": {
    route: deEventSettingsDetailsBackground,
    components: deComponents,
  },
  "event/$slug/settings/documents": {
    route: deEventSettingsDocuments,
  },
  "event/$slug/settings/documents/list": {
    route: deEventSettingsDocumentsList,
  },
  "event/$slug/settings/documents/add": {
    route: deEventSettingsDocumentsAdd,
  },
  "event/$slug/settings/location": {
    route: deEventSettingsLocation,
    stages: deStages,
    components: deComponents,
    rte: deRTE,
  },
  "event/$slug/settings/participants": {
    route: deEventSettingsParticipants,
  },
  "event/$slug/settings/participants/list": {
    route: deEventSettingsParticipantsList,
  },
  "event/$slug/settings/participants/waiting-list": {
    route: deEventSettingsParticipantsWaitingList,
  },
  "event/$slug/settings/participants/add": {
    route: deEventSettingsParticipantsAdd,
  },
  "event/$slug/settings/participants/invites": {
    route: deEventSettingsParticipantsInvites,
  },
  "event/$slug/settings/registration": {
    route: deEventSettingsRegistration,
  },
  "event/$slug/settings/registration/access": {
    route: deEventSettingsRegistrationAccess,
    components: deComponents,
  },
  "event/$slug/settings/registration/period": {
    route: deEventSettingsRegistrationPeriod,
    components: deComponents,
  },
  "event/$slug/settings/registration/limit": {
    route: deEventSettingsRegistrationLimit,
    components: deComponents,
  },
  "event/$slug/settings/related-events": {
    route: deEventSettingsRelatedEvents,
  },
  "event/$slug/settings/related-events/parent-event": {
    route: deEventSettingsRelatedEventsParentEvent,
    stages: deStages,
  },
  "event/$slug/settings/related-events/child-events": {
    route: deEventSettingsRelatedEventsChildEvents,
    stages: deStages,
  },
  "event/$slug/settings/responsible-orgs": {
    route: deEventSettingsResponsibleOrgs,
  },
  "event/$slug/settings/responsible-orgs/add": {
    route: deEventSettingsResponsibleOrgsAdd,
  },
  "event/$slug/settings/responsible-orgs/list": {
    route: deEventSettingsResponsibleOrgsList,
  },
  "event/$slug/settings/responsible-orgs/invites": {
    route: deEventSettingsResponsibleOrgsInvites,
  },
  "event/$slug/settings/speakers": {
    route: deEventSettingsSpeakers,
  },
  "event/$slug/settings/speakers/add": {
    route: deEventSettingsSpeakersAdd,
  },
  "event/$slug/settings/speakers/list": {
    route: deEventSettingsSpeakersList,
  },
  "event/$slug/settings/speakers/invites": {
    route: deEventSettingsSpeakersInvites,
  },
  "event/$slug/settings/team": {
    route: deEventSettingsTeam,
  },
  "event/$slug/settings/team/add": {
    route: deEventSettingsTeamAdd,
  },
  "event/$slug/settings/team/list": {
    route: deEventSettingsTeamList,
  },
  "event/$slug/settings/team/invites": {
    route: deEventSettingsTeamInvites,
  },
  "event/$slug/settings/time-period": {
    route: deEventSettingsTimePeriod,
    stages: deStages,
    components: deComponents,
  },
  // explore routes
  explore: {
    route: deExplore,
    index: deExploreIndex,
  },
  "explore/events": {
    route: deExploreEvents,
    focuses: deFocuses,
    stages: deStages,
    eventTargetGroups: deEventTargetGroups,
    eventCard: deEventCard,
  },
  "explore/fundings": deExploreFundings,
  "explore/organizations": {
    route: deExploreOrganizations,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    focuses: deFocuses,
    organizationCard: deOrganizationCard,
    components: deComponents,
  },
  "explore/profiles": {
    route: deExploreProfiles,
    offers: deOffers,
    profileCard: deProfileCard,
  },
  "explore/projects": {
    route: deExploreProjects,
    financings: deFinancings,
    disciplines: deDisciplines,
    additionalDisciplines: deAdditionalDisciplines,
    projectTargetGroups: deProjectTargetGroups,
    formats: deFormats,
    specialTargetGroups: deSpecialTargetGroups,
    projectCard: deProjectCard,
  },
  // login routes
  "login/index": deLogin,
  // my routes
  "my/events": {
    route: deMyEvents,
    stages: deStages,
    components: deComponents,
  },
  "my/organizations": {
    route: deMyOrganizations,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    focuses: deFocuses,
    organizationCard: deOrganizationCard,
    components: deComponents,
    searchOrganizationsSchema: deSearchOrganizationsSchema,
  },
  "my/projects": { route: deMyProjects, projectCard: deProjectCard },
  // organization routes
  "organization/create": {
    route: deCreateOrganization,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
    searchOrganizationsSchema: deSearchOrganizationsSchema,
  },
  "organization/$slug/detail": {
    route: deOrganizationDetail,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    imageCropper: deImageCropper,
    upload: deUpload,
  },
  "organization/$slug/detail/about": {
    route: deAboutOrganization,
    focuses: deFocuses,
  },
  "organization/$slug/detail/events": {
    route: deOrganizationEvents,
    stages: deStages,
    components: deComponents,
  },
  "organization/$slug/detail/network": {
    route: deOrganizationNetwork,
    organizationTypes: deOrganizationTypes,
    components: deComponents,
    networkTypes: deNetworkTypes,
  },
  "organization/$slug/detail/projects": {
    route: deOrganizationProjects,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  "organization/$slug/detail/team": {
    route: deOrganizationTeam,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  "organization/$slug/settings/danger-zone/change-url": {
    route: deChangeOrganizationUrl,
    components: deComponents,
  },
  "organization/$slug/settings/danger-zone/delete": deDeleteOrganization,
  "organization/$slug/settings/admins": {
    route: deOrganizationAdmins,
    searchProfilesSchema: deSearchProfilesSchema,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  "organization/$slug/settings/danger-zone": deOrganizationDangerZone,
  "organization/$slug/settings/general": {
    route: deGeneralOrganizationSettings,
    focuses: deFocuses,
    components: deComponents,
    schemas: deSchemas,
    rte: deRTE,
  },
  "organization/$slug/settings/manage": {
    route: deManageOrganizationSettings,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
    searchOrganizationsSchema: deSearchOrganizationsSchema,
  },
  "organization/$slug/settings/team": {
    route: deOrganizationTeamSettings,
    searchProfilesSchema: deSearchProfilesSchema,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  "organization/$slug/settings/web-social": {
    route: deOrganizationWebAndSocial,
    components: deComponents,
    schemas: deSchemas,
  },
  "organization/$slug/settings": {
    route: deOrganizationSettings,
  },
  // profile routes
  "profile/$username/settings/delete": deDeleteProfile,
  "profile/$username/settings/general": {
    route: deGeneralProfileSettings,
    offers: deOffers,
    socialMediaServices: deSocialMediaServices,
    rte: deRTE,
  },
  "profile/$username/settings/notifications": deProfileNotifications,
  "profile/$username/settings/security": deProfileSecurity,
  "profile/$username/index": {
    route: deProfileDetail,
    offers: deOffers,
    stages: deStages,
    organizationTypes: deOrganizationTypes,
    imageCropper: deImageCropper,
    upload: deUpload,
  },
  "profile/$username/settings": deProfileSettings,
  // project routes
  "project/$slug/detail/attachments/download": deDownloadProjectAttachments,
  "project/$slug/detail/about": {
    route: deAboutProject,
    formats: deFormats,
    disciplines: deDisciplines,
    additionalDisciplines: deAdditionalDisciplines,
    projectTargetGroups: deProjectTargetGroups,
    specialTargetGroups: deSpecialTargetGroups,
    organizationTypes: deOrganizationTypes,
    video: deVideo,
  },
  "project/$slug/detail/attachments": deProjectAttachments,
  "project/$slug/detail/requirements": {
    route: deProjectRequirements,
    financings: deFinancings,
  },
  "project/$slug/settings/attachments/download":
    deDownloadProjectAttachmentsFromSettings,
  "project/$slug/settings/danger-zone/change-url": {
    route: deChangeProjectUrl,
    components: deComponents,
  },
  "project/$slug/settings/danger-zone/delete": deDeleteProject,
  "project/$slug/settings/admins": {
    route: deProjectAdmins,
    searchProfilesSchema: deSearchProfilesSchema,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  "project/$slug/settings/attachments": {
    route: deProjectAttachmentsSettings,
    upload: deUpload,
  },
  "project/$slug/settings/danger-zone": deProjectDangerZone,
  "project/$slug/settings/details": {
    route: deProjectDetails,
    schemas: deSchemas,
    disciplines: deDisciplines,
    additionalDisciplines: deAdditionalDisciplines,
    projectTargetGroups: deProjectTargetGroups,
    specialTargetGroups: deSpecialTargetGroups,
    rte: deRTE,
    components: deComponents,
  },
  "project/$slug/settings/general": {
    route: deGeneralProjectSettings,
    schemas: deSchemas,
    formats: deFormats,
    components: deComponents,
  },
  "project/$slug/settings/index": deProjectSettingsIndex,
  "project/$slug/settings/requirements": {
    route: deProjectRequirementsSettings,
    financings: deFinancings,
    rte: deRTE,
    components: deComponents,
  },
  "project/$slug/settings/responsible-orgs": {
    route: deResponsibleOrganizationsOfProject,
    searchOrganizationsSchema: deSearchOrganizationsSchema,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  "project/$slug/settings/team": {
    route: deProjectTeam,
    searchProfilesSchema: deSearchProfilesSchema,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  "project/$slug/settings/web-social": {
    route: deProjectWebAndSocial,
    components: deComponents,
    schemas: deSchemas,
  },
  "project/$slug/detail": {
    route: deProjectDetail,
    imageCropper: deImageCropper,
    upload: deUpload,
  },
  "project/$slug/settings": deProjectSettings,
  "project/create": deCreateProject,
  // register routes
  "register/index": deRegister,
  // reset credentials routes
  "reset/index": deResetPassword,
  "reset/set-password": deSetNewPassword,
  // accept terms route
  "accept-terms": deAcceptTerms,
  // accessibility-statement route
  "accessibility-statement": deAccessibilityStatement,
  // dashboard route
  dashboard: {
    route: deDashboard,
    profileCard: deProfileCard,
    offers: deOffers,
    organizationCard: deOrganizationCard,
    focuses: deFocuses,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    eventCard: deEventCard,
    stages: deStages,
    projectCard: deProjectCard,
  },
  // goodbye route
  goodbye: deGoodbye,
  // help route
  help: deHelp,
  // imprint route
  imprint: deImprint,
  // landing route
  index: { route: deLanding, faq: deHelp.faq, roadmap: deRoadmap },
  // map route
  map: {
    route: deMap,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
  },
  // privacy-policy route
  "privacy-policy": dePrivacyPolicy,
  // resources route
  resources: deResources,
  // terms-of-use route
  "terms-of-use": deTermsOfUse,
  // splat routes
  $: deSplat,
  // datasets
  networkTypes: deNetworkTypes,
  organizationTypes: deOrganizationTypes,
  focuses: deFocuses,
  stages: deStages,
  tags: deTags,
  eventTypes: deEventTypes,
  eventTargetGroups: deEventTargetGroups,
  experienceLevels: deExperienceLevels,
  financings: deFinancings,
  disciplines: deDisciplines,
  projectTargetGroups: deProjectTargetGroups,
  specialTargetGroups: deSpecialTargetGroups,
  formats: deFormats,
  additionalDisciplines: deAdditionalDisciplines,
  offers: deOffers,
} as const;

const en = {
  // root
  root: { route: enMeta, footer: enFooter },
  // auth routes
  "auth/confirm": enConfirmAuthAction,
  "auth/request-confirmation": enRequestConfirmation,
  "auth/verify": enVerify,
  "auth/keycloak.callback": enKeycloakCallback,
  // event routes
  "event/$slug/documents-download": enDownloadEventDocuments,
  "event/$slug/detail": {
    route: enEventDetail,
    stages: enStages,
    eventAbuseReportReasonSuggestions: enEventAbuseReportReasonSuggestions,
  },
  "event/$slug/detail/about": {
    route: enAboutEvent,
    experienceLevels: enExperienceLevels,
    focuses: enFocuses,
    eventTypes: enEventTypes,
    eventTargetGroups: enEventTargetGroups,
    tags: enTags,
    networkTypes: enNetworkTypes,
    organizationTypes: enOrganizationTypes,
  },
  "event/$slug/detail/participants": {
    route: enEventParticipants,
  },
  "event/$slug/detail/child-events": {
    route: enChildEvents,
    stages: enStages,
  },
  // next event routes
  "event/create": {
    route: enCreateEvent,
    stages: enStages,
  },
  "event/$slug/settings": {
    route: enEventSettings,
  },
  "event/$slug/settings/admins": {
    route: enEventSettingsAdmins,
  },
  "event/$slug/settings/admins/add": {
    route: enEventSettingsAdminsAdd,
  },
  "event/$slug/settings/admins/list": {
    route: enEventSettingsAdminsList,
  },
  "event/$slug/settings/admins/invites": {
    route: enEventSettingsAdminsInvites,
  },
  "event/$slug/settings/danger-zone": {
    route: enEventSettingsDangerZone,
  },
  "event/$slug/settings/danger-zone/change-url": {
    route: enEventSettingsChangeURL,
    components: enComponents,
  },
  "event/$slug/settings/danger-zone/cancel": {
    route: enEventSettingsCancel,
    stages: enStages,
  },
  "event/$slug/settings/danger-zone/delete": {
    route: enEventSettingsDelete,
  },
  "event/$slug/settings/details": {
    route: enEventSettingsDetails,
  },
  "event/$slug/settings/details/info": {
    route: enEventSettingsDetailsInfo,
    types: enEventTypes,
    tags: enTags,
    eventTargetGroups: enEventTargetGroups,
    experienceLevels: enExperienceLevels,
    focuses: enFocuses,
    components: enComponents,
    rte: enRTE,
  },
  "event/$slug/settings/details/background": {
    route: enEventSettingsDetailsBackground,
    components: enComponents,
  },
  "event/$slug/settings/documents": {
    route: enEventSettingsDocuments,
  },
  "event/$slug/settings/documents/list": {
    route: enEventSettingsDocumentsList,
  },
  "event/$slug/settings/documents/add": {
    route: enEventSettingsDocumentsAdd,
  },
  "event/$slug/settings/location": {
    route: enEventSettingsLocation,
    stages: enStages,
    rte: enRTE,
    components: enComponents,
  },
  "event/$slug/settings/participants": {
    route: enEventSettingsParticipants,
  },
  "event/$slug/settings/participants/list": {
    route: enEventSettingsParticipantsList,
  },
  "event/$slug/settings/participants/waiting-list": {
    route: enEventSettingsParticipantsWaitingList,
  },
  "event/$slug/settings/participants/add": {
    route: enEventSettingsParticipantsAdd,
  },
  "event/$slug/settings/participants/invites": {
    route: enEventSettingsParticipantsInvites,
  },
  "event/$slug/settings/registration": {
    route: enEventSettingsRegistration,
  },
  "event/$slug/settings/registration/access": {
    route: enEventSettingsRegistrationAccess,
    components: enComponents,
  },
  "event/$slug/settings/registration/period": {
    route: enEventSettingsRegistrationPeriod,
    components: enComponents,
  },
  "event/$slug/settings/registration/limit": {
    route: enEventSettingsRegistrationLimit,
    components: enComponents,
  },
  "event/$slug/settings/related-events": {
    route: enEventSettingsRelatedEvents,
  },
  "event/$slug/settings/related-events/parent-event": {
    route: enEventSettingsRelatedEventsParentEvent,
    stages: enStages,
  },
  "event/$slug/settings/related-events/child-events": {
    route: enEventSettingsRelatedEventsChildEvents,
    stages: enStages,
  },
  "event/$slug/settings/responsible-orgs": {
    route: enEventSettingsResponsibleOrgs,
  },
  "event/$slug/settings/responsible-orgs/add": {
    route: enEventSettingsResponsibleOrgsAdd,
  },
  "event/$slug/settings/responsible-orgs/list": {
    route: enEventSettingsResponsibleOrgsList,
  },
  "event/$slug/settings/responsible-orgs/invites": {
    route: enEventSettingsResponsibleOrgsInvites,
  },
  "event/$slug/settings/speakers": {
    route: enEventSettingsSpeakers,
  },
  "event/$slug/settings/speakers/add": {
    route: enEventSettingsSpeakersAdd,
  },
  "event/$slug/settings/speakers/list": {
    route: enEventSettingsSpeakersList,
  },
  "event/$slug/settings/speakers/invites": {
    route: enEventSettingsSpeakersInvites,
  },
  "event/$slug/settings/team": {
    route: enEventSettingsTeam,
  },
  "event/$slug/settings/team/add": {
    route: enEventSettingsTeamAdd,
  },
  "event/$slug/settings/team/list": {
    route: enEventSettingsTeamList,
  },
  "event/$slug/settings/team/invites": {
    route: enEventSettingsTeamInvites,
  },
  "event/$slug/settings/time-period": {
    route: enEventSettingsTimePeriod,
    stages: enStages,
    components: enComponents,
  },
  // explore routes
  explore: {
    route: enExplore,
    index: enExploreIndex,
  },
  "explore/events": {
    route: enExploreEvents,
    focuses: enFocuses,
    stages: enStages,
    eventTargetGroups: enEventTargetGroups,
    eventCard: enEventCard,
  },
  "explore/fundings": enExploreFundings,
  "explore/organizations": {
    route: enExploreOrganizations,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    focuses: enFocuses,
    organizationCard: enOrganizationCard,
    components: enComponents,
  },
  "explore/profiles": {
    route: enExploreProfiles,
    offers: enOffers,
    profileCard: enProfileCard,
  },
  "explore/projects": {
    route: enExploreProjects,
    financings: enFinancings,
    disciplines: enDisciplines,
    projectTargetGroups: enProjectTargetGroups,
    specialTargetGroups: enSpecialTargetGroups,
    formats: enFormats,
    additionalDisciplines: enAdditionalDisciplines,
    projectCard: enProjectCard,
  },
  // login routes
  "login/index": enLogin,
  // my routes
  "my/events": {
    route: enMyEvents,
    stages: enStages,
    components: enComponents,
  },
  "my/organizations": {
    route: enMyOrganizations,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    focuses: enFocuses,
    organizationCard: enOrganizationCard,
    components: enComponents,
    searchOrganizationsSchema: enSearchOrganizationsSchema,
  },
  "my/projects": { route: enMyProjects, projectCard: enProjectCard },
  // organization routes
  "organization/create": {
    route: enCreateOrganization,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
    searchOrganizationsSchema: enSearchOrganizationsSchema,
  },
  "organization/$slug/detail": {
    route: enOrganizationDetail,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    imageCropper: enImageCropper,
    upload: enUpload,
  },
  "organization/$slug/detail/about": {
    route: enAboutOrganization,
    focuses: enFocuses,
  },
  "organization/$slug/detail/events": {
    route: enOrganizationEvents,
    stages: enStages,
    components: enComponents,
  },
  "organization/$slug/detail/network": {
    route: enOrganizationNetwork,
    organizationTypes: enOrganizationTypes,
    components: enComponents,
    networkTypes: enNetworkTypes,
  },
  "organization/$slug/detail/projects": {
    route: enOrganizationProjects,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  "organization/$slug/detail/team": {
    route: enOrganizationTeam,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  "organization/$slug/settings/danger-zone/change-url": {
    route: enChangeOrganizationUrl,
    components: enComponents,
  },
  "organization/$slug/settings/danger-zone/delete": enDeleteOrganization,
  "organization/$slug/settings/admins": {
    route: enOrganizationAdmins,
    searchProfilesSchema: enSearchProfilesSchema,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  "organization/$slug/settings/danger-zone": enOrganizationDangerZone,
  "organization/$slug/settings/general": {
    route: enGeneralOrganizationSettings,
    focuses: enFocuses,
    components: enComponents,
    schemas: enSchemas,
    rte: enRTE,
  },
  "organization/$slug/settings/manage": {
    route: enManageOrganizationSettings,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
    searchOrganizationsSchema: enSearchOrganizationsSchema,
  },
  "organization/$slug/settings/team": {
    route: enOrganizationTeamSettings,
    searchProfilesSchema: enSearchProfilesSchema,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  "organization/$slug/settings/web-social": {
    route: enOrganizationWebAndSocial,
    components: enComponents,
    schemas: enSchemas,
  },
  "organization/$slug/settings": {
    route: enOrganizationSettings,
  },
  // profile routes
  "profile/$username/settings/delete": enDeleteProfile,
  "profile/$username/settings/general": {
    route: enGeneralProfileSettings,
    offers: enOffers,
    socialMediaServices: enSocialMediaServices,
    rte: enRTE,
  },
  "profile/$username/settings/notifications": enProfileNotifications,
  "profile/$username/settings/security": enProfileSecurity,
  "profile/$username/index": {
    route: enProfileDetail,
    offers: enOffers,
    stages: enStages,
    organizationTypes: enOrganizationTypes,
    imageCropper: enImageCropper,
    upload: enUpload,
  },
  "profile/$username/settings": enProfileSettings,
  // project routes
  "project/$slug/detail/attachments/download": enDownloadProjectAttachments,
  "project/$slug/detail/about": {
    route: enAboutProject,
    formats: enFormats,
    disciplines: enDisciplines,
    additionalDisciplines: enAdditionalDisciplines,
    projectTargetGroups: enProjectTargetGroups,
    specialTargetGroups: enSpecialTargetGroups,
    organizationTypes: enOrganizationTypes,
    video: enVideo,
  },
  "project/$slug/detail/attachments": enProjectAttachments,
  "project/$slug/detail/requirements": {
    route: enProjectRequirements,
    financings: enFinancings,
  },
  "project/$slug/settings/attachments/download":
    enDownloadProjectAttachmentsFromSettings,
  "project/$slug/settings/danger-zone/change-url": {
    route: enChangeProjectUrl,
    components: enComponents,
  },
  "project/$slug/settings/danger-zone/delete": enDeleteProject,
  "project/$slug/settings/admins": {
    route: enProjectAdmins,
    searchProfilesSchema: enSearchProfilesSchema,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  "project/$slug/settings/attachments": {
    route: enProjectAttachmentsSettings,
    upload: enUpload,
  },
  "project/$slug/settings/danger-zone": enProjectDangerZone,
  "project/$slug/settings/details": {
    route: enProjectDetails,
    schemas: enSchemas,
    disciplines: enDisciplines,
    additionalDisciplines: enAdditionalDisciplines,
    projectTargetGroups: enProjectTargetGroups,
    specialTargetGroups: enSpecialTargetGroups,
    rte: enRTE,
    components: enComponents,
  },
  "project/$slug/settings/general": {
    route: enGeneralProjectSettings,
    schemas: enSchemas,
    formats: enFormats,
    components: enComponents,
  },
  "project/$slug/settings/index": enProjectSettingsIndex,
  "project/$slug/settings/requirements": {
    route: enProjectRequirementsSettings,
    financings: enFinancings,
    rte: enRTE,
    components: enComponents,
  },
  "project/$slug/settings/responsible-orgs": {
    route: enResponsibleOrganizationsOfProject,
    searchOrganizationsSchema: enSearchOrganizationsSchema,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  "project/$slug/settings/team": {
    route: enProjectTeam,
    searchProfilesSchema: enSearchProfilesSchema,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  "project/$slug/settings/web-social": {
    route: enProjectWebAndSocial,
    components: enComponents,
    schemas: enSchemas,
  },
  "project/$slug/detail": {
    route: enProjectDetail,
    imageCropper: enImageCropper,
    upload: enUpload,
  },
  "project/$slug/settings": enProjectSettings,
  "project/create": enCreateProject,
  // register routes
  "register/index": enRegister,
  // reset credentials routes
  "reset/index": enResetPassword,
  "reset/set-password": enSetNewPassword,
  // accept terms route
  "accept-terms": enAcceptTerms,
  // accessibility-statement route
  "accessibility-statement": enAccessibilityStatement,
  // dashboard route
  dashboard: {
    route: enDashboard,
    profileCard: enProfileCard,
    offers: enOffers,
    organizationCard: enOrganizationCard,
    focuses: enFocuses,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    eventCard: enEventCard,
    stages: enStages,
    projectCard: enProjectCard,
  },
  // goodbye route
  goodbye: enGoodbye,
  // help route
  help: enHelp,
  // imprint route
  imprint: enImprint,
  // landing route
  index: { route: enLanding, faq: enHelp.faq, roadmap: enRoadmap },
  // map route
  map: {
    route: enMap,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
  },
  // privacy-policy route
  "privacy-policy": enPrivacyPolicy,
  // resources route
  resources: enResources,
  // terms-of-use route
  "terms-of-use": enTermsOfUse,
  // splat routes
  $: enSplat,
  // datasets
  networkTypes: enNetworkTypes,
  organizationTypes: enOrganizationTypes,
  focuses: enFocuses,
  stages: enStages,
  tags: enTags,
  eventTypes: enEventTypes,
  eventTargetGroups: enEventTargetGroups,
  experienceLevels: enExperienceLevels,
  financings: enFinancings,
  disciplines: enDisciplines,
  projectTargetGroups: enProjectTargetGroups,
  specialTargetGroups: enSpecialTargetGroups,
  formats: enFormats,
  additionalDisciplines: enAdditionalDisciplines,
  offers: enOffers,
} as const;

export const languageModuleMap = {
  de,
  en,
} as const;
