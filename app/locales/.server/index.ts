/* de */
// components
import { locale as deImageCropper } from "./de/components/image-cropper";
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
// event routes
import { locale as deAddEventAdmin } from "./de/routes/event/$slug/settings/admins/add-admin";
import { locale as deRemoveEventAdmin } from "./de/routes/event/$slug/settings/admins/remove-admin";
import { locale as deDeleteEventDocuments } from "./de/routes/event/$slug/settings/documents/delete-documents";
import { locale as deEditEventDocument } from "./de/routes/event/$slug/settings/documents/edit-document";
import { locale as deUploadEventDocument } from "./de/routes/event/$slug/settings/documents/upload-document";
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
// next routes
import { locale as deNextChangeOrganizationUrl } from "./de/routes/next/organization/$slug/settings/danger-zone/change-url";
import { locale as deNextDeleteOrganization } from "./de/routes/next/organization/$slug/settings/danger-zone/delete";
import { locale as deNextOrganizationAdmins } from "./de/routes/next/organization/$slug/settings/admins";
import { locale as deNextOrganizationDangerZone } from "./de/routes/next/organization/$slug/settings/danger-zone";
import { locale as deNextOrganizationTeam } from "./de/routes/next/organization/$slug/settings/team";
import { locale as deNextOrganizationWebAndSocial } from "./de/routes/next/organization/$slug/settings/web-social";
import { locale as deNextOrganizationSettings } from "./de/routes/next/organization/$slug/settings";
import { locale as deNextCreateOrganization } from "./de/routes/next/organization/create";
// organization routes
import { locale as deAboutOrganization } from "./de/routes/organization/$slug/detail/about";
import { locale as deOrganizationEvents } from "./de/routes/organization/$slug/detail/events";
import { locale as deOrganizationDetailIndex } from "./de/routes/organization/$slug/detail/index";
import { locale as deOrganizationNetwork } from "./de/routes/organization/$slug/detail/network";
import { locale as deOrganizationProjects } from "./de/routes/organization/$slug/detail/projects";
import { locale as deOrganizationTeam } from "./de/routes/organization/$slug/detail/team";
import { locale as deAddOrganizationAdmin } from "./de/routes/organization/$slug/settings/admins/add-admin";
import { locale as deCancelOrganizationAdminInvite } from "./de/routes/organization/$slug/settings/admins/cancel-invite";
import { locale as deRemoveOrganizationAdmin } from "./de/routes/organization/$slug/settings/admins/remove-admin";
import { locale as deAddOrganizationNetworkMember } from "./de/routes/organization/$slug/settings/network/add";
import { locale as deOrganizationNetworkSettings } from "./de/routes/organization/$slug/settings/network/index";
import { locale as deRemoveOrganizationNetworkMember } from "./de/routes/organization/$slug/settings/network/remove";
import { locale as deAddOrganizationTeamMember } from "./de/routes/organization/$slug/settings/team/add-member";
import { locale as deCancelOrganizationTeamMemberInvite } from "./de/routes/organization/$slug/settings/team/cancel-invite";
import { locale as deRemoveOrganizationTeamMember } from "./de/routes/organization/$slug/settings/team/remove-member";
import { locale as deOrganizationAdmins } from "./de/routes/organization/$slug/settings/admins";
import { locale as deDeleteOrganization } from "./de/routes/organization/$slug/settings/delete";
import { locale as deGeneralOrganizationSettings } from "./de/routes/organization/$slug/settings/general";
import { locale as deOrganizationTeamSettings } from "./de/routes/organization/$slug/settings/team";
import { locale as deOrganizationDetail } from "./de/routes/organization/$slug/detail";
import { locale as deOrganizationSettings } from "./de/routes/organization/$slug/settings";
import { locale as deCreateOrganization } from "./de/routes/organization/create";
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
import { locale as deEditProjectAttachments } from "./de/routes/project/$slug/settings/attachments/edit";
import { locale as deChangeProjectUrl } from "./de/routes/project/$slug/settings/danger-zone/change-url";
import { locale as deDeleteProject } from "./de/routes/project/$slug/settings/danger-zone/delete";
import { locale as deProjectDangerZoneIndex } from "./de/routes/project/$slug/settings/danger-zone/index";
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
// search route
import { locale as deSearch } from "./de/routes/search";
// verification route
import { locale as deVerification } from "./de/routes/verification";
// schemas
import { locale as deSearchProfilesSchema } from "./de/schemas/searchProfiles";
// utils
import { locale as deSchemas } from "./de/utils/schemas";
import { locale as deSocialMediaServices } from "./de/utils/social-media-services";
// components.ts
import { locale as deComponents } from "./de/components";
// help.ts
import { locale as deHelp } from "./de/help";
// meta.ts
import { locale as deMeta } from "./de/meta";

/* en */
// components
import { locale as enImageCropper } from "./en/components/image-cropper";
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
// event routes
import { locale as enAddEventAdmin } from "./en/routes/event/$slug/settings/admins/add-admin";
import { locale as enRemoveEventAdmin } from "./en/routes/event/$slug/settings/admins/remove-admin";
import { locale as enDeleteEventDocuments } from "./en/routes/event/$slug/settings/documents/delete-documents";
import { locale as enEditEventDocument } from "./en/routes/event/$slug/settings/documents/edit-document";
import { locale as enUploadEventDocument } from "./en/routes/event/$slug/settings/documents/upload-document";
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
// next routes
import { locale as enNextChangeOrganizationUrl } from "./en/routes/next/organization/$slug/settings/danger-zone/change-url";
import { locale as enNextDeleteOrganization } from "./en/routes/next/organization/$slug/settings/danger-zone/delete";
import { locale as enNextOrganizationAdmins } from "./en/routes/next/organization/$slug/settings/admins";
import { locale as enNextOrganizationDangerZone } from "./en/routes/next/organization/$slug/settings/danger-zone";
import { locale as enNextOrganizationTeam } from "./en/routes/next/organization/$slug/settings/team";
import { locale as enNextOrganizationWebAndSocial } from "./en/routes/next/organization/$slug/settings/web-social";
import { locale as enNextOrganizationSettings } from "./en/routes/next/organization/$slug/settings";
import { locale as enNextCreateOrganization } from "./en/routes/next/organization/create";
// organization routes
import { locale as enAboutOrganization } from "./en/routes/organization/$slug/detail/about";
import { locale as enOrganizationEvents } from "./en/routes/organization/$slug/detail/events";
import { locale as enOrganizationDetailIndex } from "./en/routes/organization/$slug/detail/index";
import { locale as enOrganizationNetwork } from "./en/routes/organization/$slug/detail/network";
import { locale as enOrganizationProjects } from "./en/routes/organization/$slug/detail/projects";
import { locale as enOrganizationTeam } from "./en/routes/organization/$slug/detail/team";
import { locale as enAddOrganizationAdmin } from "./en/routes/organization/$slug/settings/admins/add-admin";
import { locale as enCancelOrganizationAdminInvite } from "./en/routes/organization/$slug/settings/admins/cancel-invite";
import { locale as enRemoveOrganizationAdmin } from "./en/routes/organization/$slug/settings/admins/remove-admin";
import { locale as enAddOrganizationNetworkMember } from "./en/routes/organization/$slug/settings/network/add";
import { locale as enOrganizationNetworkSettings } from "./en/routes/organization/$slug/settings/network/index";
import { locale as enRemoveOrganizationNetworkMember } from "./en/routes/organization/$slug/settings/network/remove";
import { locale as enAddOrganizationTeamMember } from "./en/routes/organization/$slug/settings/team/add-member";
import { locale as enCancelOrganizationTeamMemberInvite } from "./en/routes/organization/$slug/settings/team/cancel-invite";
import { locale as enRemoveOrganizationTeamMember } from "./en/routes/organization/$slug/settings/team/remove-member";
import { locale as enOrganizationAdmins } from "./en/routes/organization/$slug/settings/admins";
import { locale as enDeleteOrganization } from "./en/routes/organization/$slug/settings/delete";
import { locale as enGeneralOrganizationSettings } from "./en/routes/organization/$slug/settings/general";
import { locale as enOrganizationTeamSettings } from "./en/routes/organization/$slug/settings/team";
import { locale as enOrganizationDetail } from "./en/routes/organization/$slug/detail";
import { locale as enOrganizationSettings } from "./en/routes/organization/$slug/settings";
import { locale as enCreateOrganization } from "./en/routes/organization/create";
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
import { locale as enEditProjectAttachments } from "./en/routes/project/$slug/settings/attachments/edit";
import { locale as enChangeProjectUrl } from "./en/routes/project/$slug/settings/danger-zone/change-url";
import { locale as enDeleteProject } from "./en/routes/project/$slug/settings/danger-zone/delete";
import { locale as enProjectDangerZoneIndex } from "./en/routes/project/$slug/settings/danger-zone/index";
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
// search route
import { locale as enSearch } from "./en/routes/search";
// verification route
import { locale as enVerification } from "./en/routes/verification";
// schemas
import { locale as enSearchProfilesSchema } from "./en/schemas/searchProfiles";
// utils
import { locale as enSchemas } from "./en/utils/schemas";
import { locale as enSocialMediaServices } from "./en/utils/social-media-services";
// components.ts
import { locale as enComponents } from "./en/components";
// help.ts
import { locale as enHelp } from "./en/help";
// meta
import { locale as enMeta } from "./en/meta";

/* fr (poc) */
// datasets
import { locale as frOffers } from "./fr/datasets/offers";
// organisms
import { locale as frFooter } from "./fr/organisms/footer";
import { locale as frProfileCard } from "./fr/organisms/cards/profile-card";
// explore routes
import { locale as frExploreFundings } from "./fr/routes/explore/fundings";
import { locale as frExploreProfiles } from "./fr/routes/explore/profiles";
// meta
import { locale as frMeta } from "./fr/meta";

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
 * 3. Add the new language to the `supportedCookieLanguages` array in `i18n.ts`.
 * - Dont panic if all modules have type errors, the next steps fix these.
 * 4. Add the new language to the `supportedHeaderLanguages` array and transform them into a single value inside the schema in `i18n.server.ts`.
 * - Full list: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
 * - Comprehensive list (more grouped): https://www.niefuend.org/blog/internet/2017/10/alle-accept-language-codes-mit-laendernamen/
 * 4. Add the new language modules to the `languageModuleMap` object below. (Copilot can help with this)
 */

const de = {
  // root
  root: { ...deMeta, ...deFooter },
  // event routes
  "event/$slug/settings/admins/add-admin": deAddEventAdmin,
  "event/$slug/settings/admins/remove-admin": deRemoveEventAdmin,
  "event/$slug/settings/documents/delete-document": deDeleteEventDocuments,
  "event/$slug/settings/documents/edit-document": deEditEventDocument,
  "event/$slug/settings/documents/upload-document": deUploadEventDocument,
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
  "event/$slug/settings/admins": deEventAdmins,
  "event/$slug/settings/csv-download": deEventCsvDownload,
  "event/$slug/settings/delete": deDeleteEvent,
  "event/$slug/settings/documents": deEventDocuments,
  "event/$slug/settings/events": {
    ...deConnectEventsWithEvent,
    stages: deStages,
  },
  "event/$slug/settings/general": {
    ...deGeneralEventSettings,
    stages: deStages,
    experienceLevels: deExperienceLevels,
    eventTypes: deEventTypes,
    focuses: deFocuses,
    tags: deTags,
    eventTargetGroups: deEventTargetGroups,
  },
  "event/$slug/settings/organizations": deResponsibleOrganizationsOfEvent,
  "event/$slug/settings/participants": deEventParticipants,
  "event/$slug/settings/speakers": deAddSpeakersToEvent,
  "event/$slug/settings/team": deEventTeam,
  "event/$slug/settings/waiting-list": deEventWaitingList,
  "event/$slug/documents-download": deDownloadEventDocuments,
  "event/$slug/index": deEventDetail,
  "event/$slug/settings": deEventSettings,
  "event/create": deCreateEvent,
  // explore routes
  "explore/events": deExploreEvents,
  "explore/fundings": deExploreFundings,
  "explore/organizations": deExploreOrganizations,
  "explore/profiles": {
    ...deExploreProfiles,
    offers: { ...deOffers },
    ...deProfileCard,
  },
  "explore/projects": deExploreProjects,
  // login routes
  "login/index": deLogin,
  // my routes
  "my/events": deMyEvents,
  "my/organizations": deMyOrganizations,
  "my/projects": deMyProjects,
  // next routes
  "next/organization/$slug/settings/danger-zone/change-url":
    deNextChangeOrganizationUrl,
  "next/organization/$slug/settings/danger-zone/delete":
    deNextDeleteOrganization,
  "next/organization/$slug/settings/admins": deNextOrganizationAdmins,
  "next/organization/$slug/settings/danger-zone": deNextOrganizationDangerZone,
  "next/organization/$slug/settings/team": deNextOrganizationTeam,
  "next/organization/$slug/settings/web-social": deNextOrganizationWebAndSocial,
  "next/organization/$slug/settings": deNextOrganizationSettings,
  "next/organization/create": deNextCreateOrganization,
  // organization routes
  "organization/$slug/detail/about": deAboutOrganization,
  "organization/$slug/detail/events": deOrganizationEvents,
  "organization/$slug/detail/index": deOrganizationDetailIndex,
  "organization/$slug/detail/network": deOrganizationNetwork,
  "organization/$slug/detail/projects": deOrganizationProjects,
  "organization/$slug/detail/team": deOrganizationTeam,
  "organization/$slug/settings/admins/add-admin": deAddOrganizationAdmin,
  "organization/$slug/settings/admins/cancel-invite":
    deCancelOrganizationAdminInvite,
  "organization/$slug/settings/admins/remove-admin": deRemoveOrganizationAdmin,
  "organization/$slug/settings/network/add": deAddOrganizationNetworkMember,
  "organization/$slug/settings/network/index": deOrganizationNetworkSettings,
  "organization/$slug/settings/network/remove":
    deRemoveOrganizationNetworkMember,
  "organization/$slug/settings/team/add-member": deAddOrganizationTeamMember,
  "organization/$slug/settings/team/cancel-invite":
    deCancelOrganizationTeamMemberInvite,
  "organization/$slug/settings/team/remove-member":
    deRemoveOrganizationTeamMember,
  "organization/$slug/settings/admins": deOrganizationAdmins,
  "organization/$slug/settings/delete": deDeleteOrganization,
  "organization/$slug/settings/general": deGeneralOrganizationSettings,
  "organization/$slug/settings/team": deOrganizationTeamSettings,
  "organization/$slug/detail": deOrganizationDetail,
  "organization/$slug/settings": deOrganizationSettings,
  "organization/create": deCreateOrganization,
  // profile routes
  "profile/$username/settings/delete": deDeleteProfile,
  "profile/$username/settings/general": deGeneralProfileSettings,
  "profile/$username/settings/notifications": deProfileNotifications,
  "profile/$username/settings/security": deProfileSecurity,
  "profile/$username/index": deProfileDetail,
  "profile/$username/settings": deProfileSettings,
  // project routes
  "project/$slug/detail/attachments/download": deDownloadProjectAttachments,
  "project/$slug/detail/about": deAboutProject,
  "project/$slug/detail/attachments": deProjectAttachments,
  "project/$slug/detail/requirements": deProjectRequirements,
  "project/$slug/settings/attachments/download":
    deDownloadProjectAttachmentsFromSettings,
  "project/$slug/settings/attachments/edit": deEditProjectAttachments,
  "project/$slug/settings/danger-zone/change-url": deChangeProjectUrl,
  "project/$slug/settings/danger-zone/delete": deDeleteProject,
  "project/$slug/settings/danger-zone/index": deProjectDangerZoneIndex,
  "project/$slug/settings/admins": deProjectAdmins,
  "project/$slug/settings/attachments": deProjectAttachmentsSettings,
  "project/$slug/settings/danger-zone": deProjectDangerZone,
  "project/$slug/settings/details": deProjectDetails,
  "project/$slug/settings/general": deGeneralProjectSettings,
  "project/$slug/settings/index": deProjectSettingsIndex,
  "project/$slug/settings/requirements": deProjectRequirementsSettings,
  "project/$slug/settings/responsible-orgs":
    deResponsibleOrganizationsOfProject,
  "project/$slug/settings/team": deProjectTeam,
  "project/$slug/settings/web-social": deProjectWebAndSocial,
  "project/$slug/detail": deProjectDetail,
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
  "search/events": deSearchEvents,
  "search/fundings": deSearchFundings,
  "search/organizations": deSearchOrganizations,
  "search/profiles": { ...deSearchProfiles, offers: { ...deOffers } },
  "search/projects": deSearchProjects,
  // upload routes
  "upload/delete": deDeleteImage,
  "upload/image": deUploadImage,
  // accept terms route
  "accept-terms": deAcceptTerms,
  // dashboard route
  dashboard: {
    ...deDashboard,
    ...deProfileCard,
    offers: { ...deOffers },
    ...deOrganizationCard,
    focuses: { ...deFocuses },
    organizationTypes: { ...deOrganizationTypes },
    ...deEventCard,
    stages: { ...deStages },
  },
  // goodbye route
  goodbye: deGoodbye,
  // imprint route
  imprint: deImprint,
  // landing route
  index: deLanding,
  // search route
  search: deSearch,
  // verification route
  verification: deVerification,
} as const;

const en = {
  // root
  root: { ...enMeta, ...enFooter },
  // event routes
  "event/$slug/settings/admins/add-admin": enAddEventAdmin,
  "event/$slug/settings/admins/remove-admin": enRemoveEventAdmin,
  "event/$slug/settings/documents/delete-document": enDeleteEventDocuments,
  "event/$slug/settings/documents/edit-document": enEditEventDocument,
  "event/$slug/settings/documents/upload-document": enUploadEventDocument,
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
  "event/$slug/settings/admins": enEventAdmins,
  "event/$slug/settings/csv-download": enEventCsvDownload,
  "event/$slug/settings/delete": enDeleteEvent,
  "event/$slug/settings/documents": enEventDocuments,
  "event/$slug/settings/events": {
    ...enConnectEventsWithEvent,
    stages: enStages,
  },
  "event/$slug/settings/general": {
    ...enGeneralEventSettings,
    stages: enStages,
    experienceLevels: enExperienceLevels,
    focuses: enFocuses,
    eventTypes: enEventTypes,
    eventTargetGroups: enEventTargetGroups,
    tags: enTags,
  },
  "event/$slug/settings/organizations": enResponsibleOrganizationsOfEvent,
  "event/$slug/settings/participants": enEventParticipants,
  "event/$slug/settings/speakers": enAddSpeakersToEvent,
  "event/$slug/settings/team": enEventTeam,
  "event/$slug/settings/waiting-list": enEventWaitingList,
  "event/$slug/documents-download": enDownloadEventDocuments,
  "event/$slug/index": enEventDetail,
  "event/$slug/settings": enEventSettings,
  "event/create": enCreateEvent,
  // explore routes
  "explore/events": enExploreEvents,
  "explore/fundings": enExploreFundings,
  "explore/organizations": enExploreOrganizations,
  "explore/profiles": {
    ...enExploreProfiles,
    offers: { ...enOffers },
    ...enProfileCard,
  },
  "explore/projects": enExploreProjects,
  // login routes
  "login/index": enLogin,
  // my routes
  "my/events": enMyEvents,
  "my/organizations": enMyOrganizations,
  "my/projects": enMyProjects,
  // next routes
  "next/organization/$slug/settings/danger-zone/change-url":
    enNextChangeOrganizationUrl,
  "next/organization/$slug/settings/danger-zone/delete":
    enNextDeleteOrganization,
  "next/organization/$slug/settings/admins": enNextOrganizationAdmins,
  "next/organization/$slug/settings/danger-zone": enNextOrganizationDangerZone,
  "next/organization/$slug/settings/team": enNextOrganizationTeam,
  "next/organization/$slug/settings/web-social": enNextOrganizationWebAndSocial,
  "next/organization/$slug/settings": enNextOrganizationSettings,
  "next/organization/create": enNextCreateOrganization,
  // organization routes
  "organization/$slug/detail/about": enAboutOrganization,
  "organization/$slug/detail/events": enOrganizationEvents,
  "organization/$slug/detail/index": enOrganizationDetailIndex,
  "organization/$slug/detail/network": enOrganizationNetwork,
  "organization/$slug/detail/projects": enOrganizationProjects,
  "organization/$slug/detail/team": enOrganizationTeam,
  "organization/$slug/settings/admins/add-admin": enAddOrganizationAdmin,
  "organization/$slug/settings/admins/cancel-invite":
    enCancelOrganizationAdminInvite,
  "organization/$slug/settings/admins/remove-admin": enRemoveOrganizationAdmin,
  "organization/$slug/settings/network/add": enAddOrganizationNetworkMember,
  "organization/$slug/settings/network/index": enOrganizationNetworkSettings,
  "organization/$slug/settings/network/remove":
    enRemoveOrganizationNetworkMember,
  "organization/$slug/settings/team/add-member": enAddOrganizationTeamMember,
  "organization/$slug/settings/team/cancel-invite":
    enCancelOrganizationTeamMemberInvite,
  "organization/$slug/settings/team/remove-member":
    enRemoveOrganizationTeamMember,
  "organization/$slug/settings/admins": enOrganizationAdmins,
  "organization/$slug/settings/delete": enDeleteOrganization,
  "organization/$slug/settings/general": enGeneralOrganizationSettings,
  "organization/$slug/settings/team": enOrganizationTeamSettings,
  "organization/$slug/detail": enOrganizationDetail,
  "organization/$slug/settings": enOrganizationSettings,
  "organization/create": enCreateOrganization,
  // profile routes
  "profile/$username/settings/delete": enDeleteProfile,
  "profile/$username/settings/general": enGeneralProfileSettings,
  "profile/$username/settings/notifications": enProfileNotifications,
  "profile/$username/settings/security": enProfileSecurity,
  "profile/$username/index": enProfileDetail,
  "profile/$username/settings": enProfileSettings,
  // project routes
  "project/$slug/detail/attachments/download": enDownloadProjectAttachments,
  "project/$slug/detail/about": enAboutProject,
  "project/$slug/detail/attachments": enProjectAttachments,
  "project/$slug/detail/requirements": enProjectRequirements,
  "project/$slug/settings/attachments/download":
    enDownloadProjectAttachmentsFromSettings,
  "project/$slug/settings/attachments/edit": enEditProjectAttachments,
  "project/$slug/settings/danger-zone/change-url": enChangeProjectUrl,
  "project/$slug/settings/danger-zone/delete": enDeleteProject,
  "project/$slug/settings/danger-zone/index": enProjectDangerZoneIndex,
  "project/$slug/settings/admins": enProjectAdmins,
  "project/$slug/settings/attachments": enProjectAttachmentsSettings,
  "project/$slug/settings/danger-zone": enProjectDangerZone,
  "project/$slug/settings/details": enProjectDetails,
  "project/$slug/settings/general": enGeneralProjectSettings,
  "project/$slug/settings/index": enProjectSettingsIndex,
  "project/$slug/settings/requirements": enProjectRequirementsSettings,
  "project/$slug/settings/responsible-orgs":
    enResponsibleOrganizationsOfProject,
  "project/$slug/settings/team": enProjectTeam,
  "project/$slug/settings/web-social": enProjectWebAndSocial,
  "project/$slug/detail": enProjectDetail,
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
  "search/events": enSearchEvents,
  "search/fundings": enSearchFundings,
  "search/organizations": enSearchOrganizations,
  "search/profiles": { ...enSearchProfiles, offers: { ...enOffers } },
  "search/projects": enSearchProjects,
  // upload routes
  "upload/delete": enDeleteImage,
  "upload/image": enUploadImage,
  // accept terms route
  "accept-terms": enAcceptTerms,
  // dashboard route
  dashboard: {
    ...enDashboard,
    ...enProfileCard,
    offers: { ...enOffers },
    ...enOrganizationCard,
    focuses: { ...enFocuses },
    organizationTypes: { ...enOrganizationTypes },
    ...enEventCard,
    stages: { ...enStages },
  },
  // goodbye route
  goodbye: enGoodbye,
  // imprint route
  imprint: enImprint,
  // landing route
  index: enLanding,
  // search route
  search: enSearch,
  // verification route
  verification: enVerification,
} as const;

// poc
const fr = {
  // missing routes from en
  ...en,
  // root
  root: { ...frMeta, ...frFooter },
  // explore routes
  "explore/fundings": frExploreFundings,
  "explore/profiles": {
    ...frExploreProfiles,
    offers: { ...frOffers },
    ...frProfileCard,
  },
} as const;

export const languageModuleMap = {
  de,
  en,
  // poc
  fr,
} as const;
