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
// event routes
import { locale as deAddEventAdmin } from "./de/routes/event/$slug/settings/admins/add-admin";
import { locale as deRemoveEventAdmin } from "./de/routes/event/$slug/settings/admins/remove-admin";
import { locale as deAddChildEvent } from "./de/routes/event/$slug/settings/events/add-child";
import { locale as deCancelEvent } from "./de/routes/event/$slug/settings/events/cancel";
import { locale as dePublishEvent } from "./de/routes/event/$slug/settings/events/publish";
import { locale as deRemoveChildEvent } from "./de/routes/event/$slug/settings/events/remove-child";
import { locale as deSetParentEvent } from "./de/routes/event/$slug/settings/events/set-parent";
import { locale as deAddOrganizationToEvent } from "./de/routes/event/$slug/settings/organizations/add-organization";
import { locale as deRemoveOrganizationFromEvent } from "./de/routes/event/$slug/settings/organizations/remove-organization";
import { locale as deAddParticipantToEvent } from "./de/routes/event/$slug/settings/participants/add-participant";
import { locale as deRemoveParticipantFromEvent } from "./de/routes/event/$slug/settings/participants/remove-participant";
import { locale as deAddSpeakerToEvent } from "./de/routes/event/$slug/settings/speakers/add-speaker";
import { locale as deRemoveSpeakerFromEvent } from "./de/routes/event/$slug/settings/speakers/remove-speaker";
import { locale as deAddTeamMemberToEvent } from "./de/routes/event/$slug/settings/team/add-member";
import { locale as deRemoveTeamMemberFromEvent } from "./de/routes/event/$slug/settings/team/remove-member";
import { locale as deAddProfileToEventWaitingList } from "./de/routes/event/$slug/settings/waiting-list/add-to-waiting-list";
import { locale as deMoveProfileFromEventWaitingListToParticipants } from "./de/routes/event/$slug/settings/waiting-list/move-to-participants";
import { locale as deRemoveProfileFromEventWaitingList } from "./de/routes/event/$slug/settings/waiting-list/remove-from-waiting-list";
import { locale as deEventAdmins } from "./de/routes/event/$slug/settings/admins";
import { locale as deEventCsvDownload } from "./de/routes/event/$slug/settings/csv-download";
import { locale as deDeleteEvent } from "./de/routes/event/$slug/settings/delete";
import { locale as deEventDocuments } from "./de/routes/event/$slug/settings/documents";
import { locale as deConnectEventsWithEvent } from "./de/routes/event/$slug/settings/events";
import { locale as deGeneralEventSettings } from "./de/routes/event/$slug/settings/general";
import { locale as deResponsibleOrganizationsOfEvent } from "./de/routes/event/$slug/settings/organizations";
import { locale as deEventParticipants } from "./de/routes/event/$slug/settings/participants";
import { locale as deAddSpeakersToEvent } from "./de/routes/event/$slug/settings/speakers";
import { locale as deEventTeam } from "./de/routes/event/$slug/settings/team";
import { locale as deEventWaitingList } from "./de/routes/event/$slug/settings/waiting-list";
import { locale as deDownloadEventDocuments } from "./de/routes/event/$slug/documents-download";
import { locale as deEventDetail } from "./de/routes/event/$slug/index";
import { locale as deEventSettings } from "./de/routes/event/$slug/settings";
import { locale as deCreateEvent } from "./de/routes/event/create";
// explore routes
import { locale as deExplore } from "./de/routes/explore";
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
import { locale as deConfirmRegistration } from "./de/routes/register/confirm";
import { locale as deRegister } from "./de/routes/register/index";
import { locale as deVerifyRegistration } from "./de/routes/register/verify";
// reset credentials routes
import { locale as deConfirmEmailChange } from "./de/routes/reset/confirm-email";
import { locale as deConfirmPasswordChange } from "./de/routes/reset/confirm-password";
import { locale as deResetPassword } from "./de/routes/reset/index";
import { locale as deSetNewEmail } from "./de/routes/reset/set-email";
import { locale as deSetNewPassword } from "./de/routes/reset/set-password";
// search routes
import { locale as deSearchEvents } from "./de/routes/search/events";
import { locale as deSearchFundings } from "./de/routes/search/fundings";
import { locale as deSearchOrganizations } from "./de/routes/search/organizations";
import { locale as deSearchProfiles } from "./de/routes/search/profiles";
import { locale as deSearchProjects } from "./de/routes/search/projects";
// upload routes
import { locale as deDeleteImage } from "./de/routes/upload/delete";
import { locale as deUploadImage } from "./de/routes/upload/image";
// accept terms route
import { locale as deAcceptTerms } from "./de/routes/accept-terms";
// dashboard route
import { locale as deDashboard } from "./de/routes/dashboard";
// goodbye route
import { locale as deGoodbye } from "./de/routes/goodbye";
// imprint route
import { locale as deImprint } from "./de/routes/imprint";
// landing route
import { locale as deLanding } from "./de/routes/index";
// resources route
import { locale as deResources } from "./de/routes/resources";
// search route
import { locale as deSearch } from "./de/routes/search";
// verification route
import { locale as deVerification } from "./de/routes/verification";
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
// event routes
import { locale as enAddEventAdmin } from "./en/routes/event/$slug/settings/admins/add-admin";
import { locale as enRemoveEventAdmin } from "./en/routes/event/$slug/settings/admins/remove-admin";
import { locale as enAddChildEvent } from "./en/routes/event/$slug/settings/events/add-child";
import { locale as enCancelEvent } from "./en/routes/event/$slug/settings/events/cancel";
import { locale as enPublishEvent } from "./en/routes/event/$slug/settings/events/publish";
import { locale as enRemoveChildEvent } from "./en/routes/event/$slug/settings/events/remove-child";
import { locale as enSetParentEvent } from "./en/routes/event/$slug/settings/events/set-parent";
import { locale as enAddOrganizationToEvent } from "./en/routes/event/$slug/settings/organizations/add-organization";
import { locale as enRemoveOrganizationFromEvent } from "./en/routes/event/$slug/settings/organizations/remove-organization";
import { locale as enAddParticipantToEvent } from "./en/routes/event/$slug/settings/participants/add-participant";
import { locale as enRemoveParticipantFromEvent } from "./en/routes/event/$slug/settings/participants/remove-participant";
import { locale as enAddSpeakerToEvent } from "./en/routes/event/$slug/settings/speakers/add-speaker";
import { locale as enRemoveSpeakerFromEvent } from "./en/routes/event/$slug/settings/speakers/remove-speaker";
import { locale as enAddTeamMemberToEvent } from "./en/routes/event/$slug/settings/team/add-member";
import { locale as enRemoveTeamMemberFromEvent } from "./en/routes/event/$slug/settings/team/remove-member";
import { locale as enAddProfileToEventWaitingList } from "./en/routes/event/$slug/settings/waiting-list/add-to-waiting-list";
import { locale as enMoveProfileFromEventWaitingListToParticipants } from "./en/routes/event/$slug/settings/waiting-list/move-to-participants";
import { locale as enRemoveProfileFromEventWaitingList } from "./en/routes/event/$slug/settings/waiting-list/remove-from-waiting-list";
import { locale as enEventAdmins } from "./en/routes/event/$slug/settings/admins";
import { locale as enEventCsvDownload } from "./en/routes/event/$slug/settings/csv-download";
import { locale as enDeleteEvent } from "./en/routes/event/$slug/settings/delete";
import { locale as enEventDocuments } from "./en/routes/event/$slug/settings/documents";
import { locale as enConnectEventsWithEvent } from "./en/routes/event/$slug/settings/events";
import { locale as enGeneralEventSettings } from "./en/routes/event/$slug/settings/general";
import { locale as enResponsibleOrganizationsOfEvent } from "./en/routes/event/$slug/settings/organizations";
import { locale as enEventParticipants } from "./en/routes/event/$slug/settings/participants";
import { locale as enAddSpeakersToEvent } from "./en/routes/event/$slug/settings/speakers";
import { locale as enEventTeam } from "./en/routes/event/$slug/settings/team";
import { locale as enEventWaitingList } from "./en/routes/event/$slug/settings/waiting-list";
import { locale as enDownloadEventDocuments } from "./en/routes/event/$slug/documents-download";
import { locale as enEventDetail } from "./en/routes/event/$slug/index";
import { locale as enEventSettings } from "./en/routes/event/$slug/settings";
import { locale as enCreateEvent } from "./en/routes/event/create";
// explore routes
import { locale as enExplore } from "./en/routes/explore";
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
import { locale as enConfirmRegistration } from "./en/routes/register/confirm";
import { locale as enRegister } from "./en/routes/register/index";
import { locale as enVerifyRegistration } from "./en/routes/register/verify";
// reset credentials routes
import { locale as enConfirmEmailChange } from "./en/routes/reset/confirm-email";
import { locale as enConfirmPasswordChange } from "./en/routes/reset/confirm-password";
import { locale as enResetPassword } from "./en/routes/reset/index";
import { locale as enSetNewEmail } from "./en/routes/reset/set-email";
import { locale as enSetNewPassword } from "./en/routes/reset/set-password";
// search routes
import { locale as enSearchEvents } from "./en/routes/search/events";
import { locale as enSearchFundings } from "./en/routes/search/fundings";
import { locale as enSearchOrganizations } from "./en/routes/search/organizations";
import { locale as enSearchProfiles } from "./en/routes/search/profiles";
import { locale as enSearchProjects } from "./en/routes/search/projects";
// upload routes
import { locale as enDeleteImage } from "./en/routes/upload/delete";
import { locale as enUploadImage } from "./en/routes/upload/image";
// accept terms route
import { locale as enAcceptTerms } from "./en/routes/accept-terms";
// dashboard route
import { locale as enDashboard } from "./en/routes/dashboard";
// goodbye route
import { locale as enGoodbye } from "./en/routes/goodbye";
// imprint route
import { locale as enImprint } from "./en/routes/imprint";
// landing route
import { locale as enLanding } from "./en/routes/index";
// resources route
import { locale as enResources } from "./en/routes/resources";
// search route
import { locale as enSearch } from "./en/routes/search";
// verification route
import { locale as enVerification } from "./en/routes/verification";
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
  // event routes
  "event/$slug/settings/admins/add-admin": deAddEventAdmin,
  "event/$slug/settings/admins/remove-admin": deRemoveEventAdmin,
  "event/$slug/settings/events/add-child": deAddChildEvent,
  "event/$slug/settings/events/cancel": deCancelEvent,
  "event/$slug/settings/events/publish": dePublishEvent,
  "event/$slug/settings/events/remove-child": deRemoveChildEvent,
  "event/$slug/settings/events/set-parent": deSetParentEvent,
  "event/$slug/settings/organizations/add-organization":
    deAddOrganizationToEvent,
  "event/$slug/settings/organizations/remove-organization":
    deRemoveOrganizationFromEvent,
  "event/$slug/settings/participants/add-participant": deAddParticipantToEvent,
  "event/$slug/settings/participants/remove-participant":
    deRemoveParticipantFromEvent,
  "event/$slug/settings/speakers/add-speaker": deAddSpeakerToEvent,
  "event/$slug/settings/speakers/remove-speaker": deRemoveSpeakerFromEvent,
  "event/$slug/settings/team/add-member": deAddTeamMemberToEvent,
  "event/$slug/settings/team/remove-member": deRemoveTeamMemberFromEvent,
  "event/$slug/settings/waiting-list/add-to-waiting-list":
    deAddProfileToEventWaitingList,
  "event/$slug/settings/waiting-list/move-to-participants":
    deMoveProfileFromEventWaitingListToParticipants,
  "event/$slug/settings/waiting-list/remove-from-waiting-list":
    deRemoveProfileFromEventWaitingList,
  "event/$slug/settings/admins": {
    route: deEventAdmins,
    organizationTypes: deOrganizationTypes,
    stages: deStages,
  },
  "event/$slug/settings/csv-download": deEventCsvDownload,
  "event/$slug/settings/delete": deDeleteEvent,
  "event/$slug/settings/documents": {
    route: deEventDocuments,
    upload: deUpload,
  },
  "event/$slug/settings/events": {
    route: deConnectEventsWithEvent,
    organizationTypes: deOrganizationTypes,
    stages: deStages,
  },
  "event/$slug/settings/general": {
    route: deGeneralEventSettings,
    stages: deStages,
    experienceLevels: deExperienceLevels,
    eventTypes: deEventTypes,
    focuses: deFocuses,
    tags: deTags,
    eventTargetGroups: deEventTargetGroups,
    rte: deRTE,
  },
  "event/$slug/settings/organizations": {
    route: deResponsibleOrganizationsOfEvent,
    organizationTypes: deOrganizationTypes,
    stages: deStages,
  },
  "event/$slug/settings/participants": {
    route: deEventParticipants,
    organizationTypes: deOrganizationTypes,
    stages: deStages,
  },
  "event/$slug/settings/speakers": {
    route: deAddSpeakersToEvent,
    organizationTypes: deOrganizationTypes,
    stages: deStages,
  },
  "event/$slug/settings/team": {
    route: deEventTeam,
    organizationTypes: deOrganizationTypes,
    stages: deStages,
  },
  "event/$slug/settings/waiting-list": {
    route: deEventWaitingList,
    organizationTypes: deOrganizationTypes,
    stages: deStages,
  },
  "event/$slug/documents-download": deDownloadEventDocuments,
  "event/$slug/index": {
    route: deEventDetail,
    addParticipant: deAddParticipantToEvent,
    removeParticipant: deRemoveParticipantFromEvent,
    addToWaitingList: deAddProfileToEventWaitingList,
    removeFromWaitingList: deRemoveProfileFromEventWaitingList,
    stages: deStages,
    experienceLevels: deExperienceLevels,
    focuses: deFocuses,
    eventTypes: deEventTypes,
    eventTargetGroups: deEventTargetGroups,
    tags: deTags,
    eventAbuseReportReasonSuggestions: deEventAbuseReportReasonSuggestions,
    organizationTypes: deOrganizationTypes,
    imageCropper: deImageCropper,
    upload: deUpload,
  },
  "event/$slug/settings": deEventSettings,
  "event/create": deCreateEvent,
  // explore routes
  explore: {
    route: deExplore,
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
    focuses: deFocuses,
    organizationCard: deOrganizationCard,
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
    focuses: deFocuses,
    organizationCard: deOrganizationCard,
    components: deComponents,
  },
  "my/projects": { route: deMyProjects, projectCard: deProjectCard },
  // organization routes
  "organization/create": {
    route: deCreateOrganization,
    organizationTypes: deOrganizationTypes,
    networkTypes: deNetworkTypes,
    components: deComponents,
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
  },
  "organization/$slug/detail/projects": {
    route: deOrganizationProjects,
    organizationTypes: deOrganizationTypes,
    components: deComponents,
  },
  "organization/$slug/detail/team": {
    route: deOrganizationTeam,
    organizationTypes: deOrganizationTypes,
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
    components: deComponents,
  },
  "organization/$slug/settings/web-social": {
    route: deOrganizationWebAndSocial,
    components: deComponents,
    schemas: deSchemas,
  },
  "organization/$slug/settings": deOrganizationSettings,
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
    addParticipant: deAddParticipantToEvent,
    removeParticipant: deRemoveParticipantFromEvent,
    addToWaitingList: deAddProfileToEventWaitingList,
    removeFromWaitingList: deRemoveProfileFromEventWaitingList,
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
    components: deComponents,
  },
  "project/$slug/settings/team": {
    route: deProjectTeam,
    searchProfilesSchema: deSearchProfilesSchema,
    organizationTypes: deOrganizationTypes,
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
  "register/confirm": deConfirmRegistration,
  "register/index": deRegister,
  "register/verify": deVerifyRegistration,
  // reset credentials routes
  "reset/confirm-email": deConfirmEmailChange,
  "reset/confirm-password": deConfirmPasswordChange,
  "reset/index": deResetPassword,
  "reset/set-email": deSetNewEmail,
  "reset/set-password": deSetNewPassword,
  // search routes
  "search/events": {
    route: deSearchEvents,
    stages: deStages,
    eventCard: deEventCard,
  },
  "search/fundings": deSearchFundings,
  "search/organizations": {
    route: deSearchOrganizations,
    focuses: deFocuses,
    organizationTypes: deOrganizationTypes,
    organizationCard: deOrganizationCard,
  },
  "search/profiles": {
    route: deSearchProfiles,
    offers: deOffers,
    profileCard: deProfileCard,
  },
  "search/projects": { route: deSearchProjects, projectCard: deProjectCard },
  // upload routes
  "upload/delete": deDeleteImage,
  "upload/image": deUploadImage,
  // accept terms route
  "accept-terms": deAcceptTerms,
  // dashboard route
  dashboard: {
    route: deDashboard,
    profileCard: deProfileCard,
    offers: deOffers,
    organizationCard: deOrganizationCard,
    focuses: deFocuses,
    organizationTypes: deOrganizationTypes,
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
  // resources route
  resources: deResources,
  // search route
  search: deSearch,
  // verification route
  verification: deVerification,
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
  // event routes
  "event/$slug/settings/admins/add-admin": enAddEventAdmin,
  "event/$slug/settings/admins/remove-admin": enRemoveEventAdmin,
  "event/$slug/settings/events/add-child": enAddChildEvent,
  "event/$slug/settings/events/cancel": enCancelEvent,
  "event/$slug/settings/events/publish": enPublishEvent,
  "event/$slug/settings/events/remove-child": enRemoveChildEvent,
  "event/$slug/settings/events/set-parent": enSetParentEvent,
  "event/$slug/settings/organizations/add-organization":
    enAddOrganizationToEvent,
  "event/$slug/settings/organizations/remove-organization":
    enRemoveOrganizationFromEvent,
  "event/$slug/settings/participants/add-participant": enAddParticipantToEvent,
  "event/$slug/settings/participants/remove-participant":
    enRemoveParticipantFromEvent,
  "event/$slug/settings/speakers/add-speaker": enAddSpeakerToEvent,
  "event/$slug/settings/speakers/remove-speaker": enRemoveSpeakerFromEvent,
  "event/$slug/settings/team/add-member": enAddTeamMemberToEvent,
  "event/$slug/settings/team/remove-member": enRemoveTeamMemberFromEvent,
  "event/$slug/settings/waiting-list/add-to-waiting-list":
    enAddProfileToEventWaitingList,
  "event/$slug/settings/waiting-list/move-to-participants":
    enMoveProfileFromEventWaitingListToParticipants,
  "event/$slug/settings/waiting-list/remove-from-waiting-list":
    enRemoveProfileFromEventWaitingList,
  "event/$slug/settings/admins": {
    route: enEventAdmins,
    stages: enStages,
    organizationTypes: enOrganizationTypes,
  },
  "event/$slug/settings/csv-download": enEventCsvDownload,
  "event/$slug/settings/delete": enDeleteEvent,
  "event/$slug/settings/documents": {
    route: enEventDocuments,
    upload: enUpload,
  },
  "event/$slug/settings/events": {
    route: enConnectEventsWithEvent,
    stages: enStages,
    organizationTypes: enOrganizationTypes,
  },
  "event/$slug/settings/general": {
    route: enGeneralEventSettings,
    stages: enStages,
    experienceLevels: enExperienceLevels,
    focuses: enFocuses,
    eventTypes: enEventTypes,
    eventTargetGroups: enEventTargetGroups,
    tags: enTags,
    rte: enRTE,
  },
  "event/$slug/settings/organizations": {
    route: enResponsibleOrganizationsOfEvent,
    organizationTypes: enOrganizationTypes,
    stages: enStages,
  },
  "event/$slug/settings/participants": {
    route: enEventParticipants,
    stages: enStages,
    organizationTypes: enOrganizationTypes,
  },
  "event/$slug/settings/speakers": {
    route: enAddSpeakersToEvent,
    stages: enStages,
    organizationTypes: enOrganizationTypes,
  },
  "event/$slug/settings/team": {
    route: enEventTeam,
    organizationTypes: enOrganizationTypes,
    stages: enStages,
  },
  "event/$slug/settings/waiting-list": {
    route: enEventWaitingList,
    organizationTypes: enOrganizationTypes,
    stages: enStages,
  },
  "event/$slug/documents-download": enDownloadEventDocuments,
  "event/$slug/index": {
    route: enEventDetail,
    addParticipant: enAddParticipantToEvent,
    removeParticipant: enRemoveParticipantFromEvent,
    addToWaitingList: enAddProfileToEventWaitingList,
    removeFromWaitingList: enRemoveProfileFromEventWaitingList,
    stages: enStages,
    experienceLevels: enExperienceLevels,
    focuses: enFocuses,
    eventTypes: enEventTypes,
    eventTargetGroups: enEventTargetGroups,
    tags: enTags,
    eventAbuseReportReasonSuggestions: enEventAbuseReportReasonSuggestions,
    organizationTypes: enOrganizationTypes,
    imageCropper: enImageCropper,
    upload: enUpload,
  },
  "event/$slug/settings": enEventSettings,
  "event/create": enCreateEvent,
  // explore routes
  explore: {
    route: enExplore,
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
    focuses: enFocuses,
    organizationCard: enOrganizationCard,
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
    focuses: enFocuses,
    organizationCard: enOrganizationCard,
    components: enComponents,
  },
  "my/projects": { route: enMyProjects, projectCard: enProjectCard },
  // organization routes
  "organization/create": {
    route: enCreateOrganization,
    organizationTypes: enOrganizationTypes,
    networkTypes: enNetworkTypes,
    components: enComponents,
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
  },
  "organization/$slug/detail/projects": {
    route: enOrganizationProjects,
    organizationTypes: enOrganizationTypes,
    components: enComponents,
  },
  "organization/$slug/detail/team": {
    route: enOrganizationTeam,
    organizationTypes: enOrganizationTypes,
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
    components: enComponents,
  },
  "organization/$slug/settings/web-social": {
    route: enOrganizationWebAndSocial,
    components: enComponents,
    schemas: enSchemas,
  },
  "organization/$slug/settings": enOrganizationSettings,
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
    addParticipant: enAddParticipantToEvent,
    removeParticipant: enRemoveParticipantFromEvent,
    addToWaitingList: enAddProfileToEventWaitingList,
    removeFromWaitingList: enRemoveProfileFromEventWaitingList,
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
    components: enComponents,
  },
  "project/$slug/settings/team": {
    route: enProjectTeam,
    searchProfilesSchema: enSearchProfilesSchema,
    organizationTypes: enOrganizationTypes,
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
  "register/confirm": enConfirmRegistration,
  "register/index": enRegister,
  "register/verify": enVerifyRegistration,
  // reset credentials routes
  "reset/confirm-email": enConfirmEmailChange,
  "reset/confirm-password": enConfirmPasswordChange,
  "reset/index": enResetPassword,
  "reset/set-email": enSetNewEmail,
  "reset/set-password": enSetNewPassword,
  // search routes
  "search/events": {
    route: enSearchEvents,
    stages: enStages,
    eventCard: enEventCard,
  },
  "search/fundings": enSearchFundings,
  "search/organizations": {
    route: enSearchOrganizations,
    focuses: enFocuses,
    organizationTypes: enOrganizationTypes,
    organizationCard: enOrganizationCard,
  },
  "search/profiles": {
    route: enSearchProfiles,
    offers: enOffers,
    profileCard: enProfileCard,
  },
  "search/projects": { route: enSearchProjects, projectCard: enProjectCard },
  // upload routes
  "upload/delete": enDeleteImage,
  "upload/image": enUploadImage,
  // accept terms route
  "accept-terms": enAcceptTerms,
  // dashboard route
  dashboard: {
    route: enDashboard,
    profileCard: enProfileCard,
    offers: enOffers,
    organizationCard: enOrganizationCard,
    focuses: enFocuses,
    organizationTypes: enOrganizationTypes,
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
  // resources route
  resources: enResources,
  // search route
  search: enSearch,
  // verification route
  verification: enVerification,
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
