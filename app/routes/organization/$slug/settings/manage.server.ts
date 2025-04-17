import { parseWithZod } from "@conform-to/zod-v1";
import * as Sentry from "@sentry/node";
import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { manageSchema, updateNetworkSchema } from "./manage";
import { invariantResponse } from "~/lib/utils/response";
import { updateFilterVectorOfOrganization } from "./utils.server";
import { triggerEntityScore } from "~/utils.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

export type ManageOrganizationSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["organization/$slug/settings/manage"];

export async function getOrganizationWithNetworksAndNetworkMembers(options: {
  slug: string;
  authClient: SupabaseClient;
}) {
  const { slug, authClient } = options;
  const organization = await prismaClient.organization.findFirst({
    where: { slug },
    select: {
      // Just selecting id for index performance
      id: true,
      types: {
        select: {
          organizationType: {
            select: {
              id: true,
            },
          },
        },
      },
      networkTypes: {
        select: {
          networkType: {
            select: {
              id: true,
            },
          },
        },
      },
      sentNetworkJoinRequests: {
        select: {
          network: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        where: {
          status: "pending",
        },
        orderBy: {
          network: {
            name: "asc",
          },
        },
      },
      memberOf: {
        select: {
          network: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          network: {
            name: "asc",
          },
        },
      },
      sentNetworkJoinInvites: {
        select: {
          organization: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        where: {
          status: "pending",
        },
        orderBy: {
          organization: {
            name: "asc",
          },
        },
      },
      networkMembers: {
        select: {
          networkMember: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          networkMember: {
            name: "asc",
          },
        },
      },
    },
  });
  if (organization === null) {
    return null;
  }
  // enhance pendingNetworkRequests, networks, pendingNetworkMemberInvitations nad networkMembers with avatar
  const sentNetworkJoinRequests = organization.sentNetworkJoinRequests.map(
    (relation) => {
      let logo = relation.network.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return { network: { ...relation.network, logo, blurredLogo } };
    }
  );

  const memberOf = organization.memberOf.map((relation) => {
    let logo = relation.network.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.Logo,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.BlurredLogo,
          },
          blur: BlurFactor,
        });
      }
    }
    return { network: { ...relation.network, logo, blurredLogo } };
  });

  const sentNetworkJoinInvites = organization.sentNetworkJoinInvites.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return { organization: { ...relation.organization, logo, blurredLogo } };
    }
  );

  const networkMembers = organization.networkMembers.map((relation) => {
    let logo = relation.networkMember.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.Logo,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.BlurredLogo,
          },
          blur: BlurFactor,
        });
      }
    }
    return { networkMember: { ...relation.networkMember, logo, blurredLogo } };
  });

  const enhancedOrganization = {
    ...organization,
    memberOf,
    networkMembers,
    sentNetworkJoinRequests,
    sentNetworkJoinInvites,
  };

  return enhancedOrganization;
}

export async function updateOrganization(options: {
  formData: FormData;
  organization: {
    id: string;
    networkMembers: {
      networkMember: {
        id: string;
      };
    }[];
  };
  organizationTypeNetwork: {
    id: string;
  };
  locales: ManageOrganizationSettingsLocales;
}) {
  const { formData, organization, organizationTypeNetwork, locales } = options;
  const { id: organizationId, networkMembers } = organization;
  const submission = await parseWithZod(formData, {
    schema: () =>
      manageSchema.transform(async (data, ctx) => {
        const { organizationTypes: types } = data;
        const { networkTypes } = data;
        try {
          const isNetwork = types.some(
            (id) => id === organizationTypeNetwork.id
          );
          invariantResponse(
            (isNetwork === false && networkTypes.length > 0) === false,
            locales.route.error.notAllowed,
            { status: 400 }
          );
          if (isNetwork === true && networkTypes.length === 0) {
            ctx.addIssue({
              code: "custom",
              message: locales.route.error.networkTypesRequired,
              path: ["networkTypes"],
            });
            return z.NEVER;
          }
          let networkMemberQuery;
          if (isNetwork === false && networkMembers.length > 0) {
            networkMemberQuery = {
              deleteMany: {
                networkId: organizationId,
              },
            };
          }
          await prismaClient.organization.update({
            where: {
              id: organizationId,
            },
            data: {
              types: {
                deleteMany: {},
                connectOrCreate: types.map((organizationTypeId: string) => {
                  return {
                    where: {
                      organizationId_organizationTypeId: {
                        organizationId,
                        organizationTypeId,
                      },
                    },
                    create: {
                      organizationTypeId,
                    },
                  };
                }),
              },
              networkTypes: {
                deleteMany: {},
                connectOrCreate: networkTypes.map((networkTypeId: string) => {
                  return {
                    where: {
                      organizationId_networkTypeId: {
                        organizationId,
                        networkTypeId,
                      },
                    },
                    create: {
                      networkTypeId,
                    },
                  };
                }),
              },
              networkMembers: networkMemberQuery,
            },
          });
          updateFilterVectorOfOrganization(organization.id);
          triggerEntityScore({
            entity: "organization",
            where: { id: organization.id },
          });
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.updateFailed,
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "manage-organization-toast",
      key: `${new Date().getTime()}`,
      message: locales.route.content.success,
    },
  };
}

export async function updateJoinNetworkRequest(options: {
  formData: FormData;
  organization: {
    id: string;
    name: string;
  };
  intent: "requestToJoinNetwork" | "cancelNetworkJoinRequest";
  locales: ManageOrganizationSettingsLocales;
}) {
  const { formData, organization, intent, locales } = options;
  const { id: organizationId } = organization;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkSchema.transform(async (data, ctx) => {
        const { organizationId: networkId } = data;
        const network = await prismaClient.organization.findFirst({
          select: {
            id: true,
            name: true,
            types: {
              select: {
                organizationType: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
            admins: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    email: true,
                  },
                },
              },
            },
            networkMembers: {
              select: {
                networkMember: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          where: {
            id: networkId,
            types: {
              some: {
                organizationType: {
                  slug: "network",
                },
              },
            },
          },
        });
        invariantResponse(network !== null, locales.route.error.notFound, {
          status: 404,
        });
        invariantResponse(
          network.networkMembers.some((relation) => {
            return relation.networkMember.id === organizationId;
          }) === false,
          locales.route.error.alreadyMember,
          { status: 400 }
        );
        invariantResponse(
          networkId !== organizationId,
          locales.route.error.thisOrganization,
          {
            status: 400,
          }
        );
        try {
          await prismaClient.requestToNetworkToAddOrganization.upsert({
            where: {
              networkId_organizationId: {
                networkId,
                organizationId,
              },
            },
            create: {
              networkId,
              organizationId,
              status:
                intent === "requestToJoinNetwork" ? "pending" : "canceled",
            },
            update: {
              status:
                intent === "requestToJoinNetwork" ? "pending" : "canceled",
            },
          });

          await Promise.all(
            network.admins.map(async (admin) => {
              const sender = process.env.SYSTEM_MAIL_SENDER;
              const subject =
                intent === "requestToJoinNetwork"
                  ? locales.route.content.networks.requestToJoin.email.subject
                      .requested
                  : locales.route.content.networks.requestToJoin.email.subject
                      .canceled;
              const recipient = admin.profile.email;

              const text =
                intent === "requestToJoinNetwork"
                  ? getCompiledMailTemplate<"mail-templates/requests/network-to-add-organization/text.hbs">(
                      "mail-templates/requests/network-to-add-organization/text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: organization.name,
                        },
                        network: {
                          name: network.name,
                        },
                        button: {
                          url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
                          text: locales.route.content.networks.requestToJoin
                            .email.button.text,
                        },
                      },
                      "text"
                    )
                  : getCompiledMailTemplate<"mail-templates/requests/network-to-add-organization/canceled-text.hbs">(
                      "mail-templates/requests/network-to-add-organization/canceled-text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: organization.name,
                        },
                        network: {
                          name: network.name,
                        },
                      },
                      "text"
                    );
              const html =
                intent === "requestToJoinNetwork"
                  ? getCompiledMailTemplate<"mail-templates/requests/network-to-add-organization/html.hbs">(
                      "mail-templates/requests/network-to-add-organization/html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: organization.name,
                        },
                        network: {
                          name: network.name,
                        },
                        button: {
                          url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
                          text: locales.route.content.networks.requestToJoin
                            .email.button.text,
                        },
                      },
                      "html"
                    )
                  : getCompiledMailTemplate<"mail-templates/requests/network-to-add-organization/canceled-html.hbs">(
                      "mail-templates/requests/network-to-add-organization/canceled-html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: organization.name,
                        },
                        network: {
                          name: network.name,
                        },
                      },
                      "html"
                    );

              try {
                await mailer(
                  mailerOptions,
                  sender,
                  recipient,
                  subject,
                  text,
                  html
                );
              } catch (error) {
                Sentry.captureException(error);
                ctx.addIssue({
                  code: "custom",
                  message:
                    intent === "requestToJoinNetwork"
                      ? locales.route.error.requestFailed
                      : locales.route.error.cancelRequestFailed,
                });
                return z.NEVER;
              }
            })
          );
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message:
              intent === "requestToJoinNetwork"
                ? locales.route.error.requestFailed
                : locales.route.error.cancelRequestFailed,
          });
          return z.NEVER;
        }

        return { ...data, name: network.name };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "request-to-join-network-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        intent === "requestToJoinNetwork"
          ? locales.route.content.networks.requestToJoin.success
          : locales.route.content.networks.requestToJoin.cancelSuccess,
        { organization: submission.value.name }
      ),
    },
  };
}

export async function leaveNetwork(options: {
  formData: FormData;
  organization: {
    id: string;
    name: string;
  };
  locales: ManageOrganizationSettingsLocales;
}) {
  const { formData, organization, locales } = options;
  const { id: organizationId } = organization;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkSchema.transform(async (data, ctx) => {
        const { organizationId: networkId } = data;
        let relation;
        try {
          relation = await prismaClient.memberOfNetwork.delete({
            select: {
              network: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            where: {
              networkId_networkMemberId: {
                networkId,
                networkMemberId: organizationId,
              },
            },
          });
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.updateFailed,
          });
          return z.NEVER;
        }

        return { ...data, name: relation.network.name };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "leave-network-toast",
      level: "neutral",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.networks.current.leave.success,
        { organization: submission.value.name }
      ),
    },
  };
}

export async function updateNetworkMemberInvite(options: {
  formData: FormData;
  organization: {
    id: string;
    name: string;
    types: {
      organizationType: {
        id: string;
      };
    }[];
    networkMembers: {
      networkMember: {
        id: string;
      };
    }[];
  };
  organizationTypeNetwork: {
    id: string;
  };
  intent: "inviteNetworkMember" | "cancelNetworkMemberInvitation";
  locales: ManageOrganizationSettingsLocales;
}) {
  const { formData, organization, organizationTypeNetwork, intent, locales } =
    options;
  const { id: organizationId } = organization;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkSchema.transform(async (data, ctx) => {
        const { organizationId: networkMemberId } = data;
        const isNetwork = organization.types.some((relation) => {
          return relation.organizationType.id === organizationTypeNetwork.id;
        });
        invariantResponse(isNetwork !== false, locales.route.error.notAllowed, {
          status: 400,
        });
        invariantResponse(
          organization.networkMembers.some((relation) => {
            return relation.networkMember.id === networkMemberId;
          }) === false,
          locales.route.error.alreadyMember,
          { status: 400 }
        );
        invariantResponse(
          networkMemberId !== organizationId,
          locales.route.error.thisOrganization,
          {
            status: 400,
          }
        );
        const networkMember = await prismaClient.organization.findFirst({
          select: {
            id: true,
            name: true,
            admins: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    email: true,
                  },
                },
              },
            },
          },
          where: {
            id: networkMemberId,
          },
        });
        invariantResponse(
          networkMember !== null,
          locales.route.error.notFound,
          {
            status: 404,
          }
        );
        try {
          await prismaClient.inviteForOrganizationToJoinNetwork.upsert({
            where: {
              organizationId_networkId: {
                networkId: organizationId,
                organizationId: networkMemberId,
              },
            },
            create: {
              networkId: organizationId,
              organizationId: networkMemberId,
              status: intent === "inviteNetworkMember" ? "pending" : "canceled",
            },
            update: {
              status: intent === "inviteNetworkMember" ? "pending" : "canceled",
            },
          });

          await Promise.all(
            networkMember.admins.map(async (admin) => {
              const sender = process.env.SYSTEM_MAIL_SENDER;
              const subject =
                intent === "inviteNetworkMember"
                  ? locales.route.content.networkMembers.invite.email.subject
                      .invited
                  : locales.route.content.networkMembers.invite.email.subject
                      .canceled;
              const recipient = admin.profile.email;

              const text =
                intent === "inviteNetworkMember"
                  ? getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/text.hbs">(
                      "mail-templates/invites/organization-to-join-network/text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: networkMember.name,
                        },
                        network: {
                          name: organization.name,
                        },
                        button: {
                          url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
                          text: locales.route.content.networkMembers.invite
                            .email.button.text,
                        },
                      },
                      "text"
                    )
                  : getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/canceled-text.hbs">(
                      "mail-templates/invites/organization-to-join-network/canceled-text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: networkMember.name,
                        },
                        network: {
                          name: organization.name,
                        },
                      },
                      "text"
                    );
              const html =
                intent === "inviteNetworkMember"
                  ? getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/html.hbs">(
                      "mail-templates/invites/organization-to-join-network/html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: networkMember.name,
                        },
                        network: {
                          name: organization.name,
                        },
                        button: {
                          url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
                          text: locales.route.content.networkMembers.invite
                            .email.button.text,
                        },
                      },
                      "html"
                    )
                  : getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/canceled-html.hbs">(
                      "mail-templates/invites/organization-to-join-network/canceled-html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: networkMember.name,
                        },
                        network: {
                          name: organization.name,
                        },
                      },
                      "html"
                    );

              try {
                await mailer(
                  mailerOptions,
                  sender,
                  recipient,
                  subject,
                  text,
                  html
                );
              } catch (error) {
                Sentry.captureException(error);
                ctx.addIssue({
                  code: "custom",
                  message:
                    intent === "inviteNetworkMember"
                      ? locales.route.error.inviteFailed
                      : locales.route.error.cancelInviteFailed,
                });
                return z.NEVER;
              }
            })
          );
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message:
              intent === "inviteNetworkMember"
                ? locales.route.error.inviteFailed
                : locales.route.error.cancelInviteFailed,
          });
          return z.NEVER;
        }

        return { ...data, name: networkMember.name };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "add-network-member-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        intent === "inviteNetworkMember"
          ? locales.route.content.networkMembers.invite.success
          : locales.route.content.networkMembers.invite.cancelSuccess,
        { organization: submission.value.name }
      ),
    },
  };
}

export async function removeNetworkMember(options: {
  formData: FormData;
  organization: {
    id: string;
    name: string;
  };
  locales: ManageOrganizationSettingsLocales;
}) {
  const { formData, organization, locales } = options;
  const { id: organizationId, name } = organization;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkSchema.transform(async (data, ctx) => {
        const { organizationId: networkMemberId } = data;
        try {
          await prismaClient.memberOfNetwork.delete({
            where: {
              networkId_networkMemberId: {
                networkId: organizationId,
                networkMemberId,
              },
            },
          });
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.updateFailed,
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "remove-network-member-toast",
      level: "neutral",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.networkMembers.current.remove.success,
        { organization: name }
      ),
    },
  };
}
