import { parseWithZod } from "@conform-to/zod-v1";
import * as Sentry from "@sentry/remix";
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

export type ManageOrganizationSettingsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["next/organization/$slug/settings/manage"];

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
  const { id: _id, ...rest } = organization;
  // enhance networks and networkMembers with avatar
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
  const enhancedOrganization = { ...rest, memberOf, networkMembers };

  return enhancedOrganization;
}

export async function updateOrganization(options: {
  formData: FormData;
  organizationId: string;
  locales: ManageOrganizationSettingsLocales;
}) {
  const { formData, organizationId, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      manageSchema.transform(async (data, ctx) => {
        const { organizationTypes: types } = data;
        let { networkTypes } = data;
        try {
          const organizationTypeNetwork =
            await prismaClient.organizationType.findFirst({
              select: {
                id: true,
              },
              where: {
                slug: "network",
              },
            });
          invariantResponse(
            organizationTypeNetwork !== null,
            locales.route.error.organizationTypeNetworkNotFound,
            { status: 404 }
          );
          const isNetwork = types.some(
            (id) => id === organizationTypeNetwork.id
          );

          if (isNetwork === false && networkTypes.length > 0) {
            ctx.addIssue({
              code: "custom",
              message: locales.route.error.notAllowed,
            });
            return z.NEVER;
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
      id: "manage-organization-toast",
      key: `${new Date().getTime()}`,
      message: locales.route.content.success,
    },
  };
}

export async function joinNetwork(options: {
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
        const { organizationId: networkId } = data;
        try {
          await prismaClient.memberOfNetwork.create({
            data: {
              networkMemberId: organizationId,
              networkId,
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
      id: "join-network-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.networks.join.success,
        { organization: name }
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
  const { id: organizationId, name } = organization;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkSchema.transform(async (data, ctx) => {
        const { organizationId: networkId } = data;
        try {
          await prismaClient.memberOfNetwork.delete({
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
      id: "leave-network-toast",
      level: "neutral",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.networks.current.leave.success,
        { organization: name }
      ),
    },
  };
}

export async function addNetworkMember(options: {
  formData: FormData;
  organization: {
    id: string;
    name: string;
    types: {
      organizationType: {
        slug: string;
      };
    }[];
  };
  locales: ManageOrganizationSettingsLocales;
}) {
  const { formData, organization, locales } = options;
  const { id: organizationId, name } = organization;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkSchema.transform(async (data, ctx) => {
        const { organizationId: networkMemberId } = data;
        const organizationTypeNetwork =
          await prismaClient.organizationType.findFirst({
            select: {
              slug: true,
            },
            where: {
              slug: "network",
            },
          });
        invariantResponse(
          organizationTypeNetwork !== null,
          locales.route.error.organizationTypeNetworkNotFound,
          { status: 404 }
        );
        const isNetwork = organization.types.some((relation) => {
          return (
            relation.organizationType.slug === organizationTypeNetwork.slug
          );
        });
        if (isNetwork === false) {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.notAllowed,
          });
          return z.NEVER;
        }
        try {
          await prismaClient.memberOfNetwork.create({
            data: {
              networkMemberId,
              networkId: organizationId,
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
      id: "add-network-member-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.content.networkMembers.add.success,
        { organization: name }
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
