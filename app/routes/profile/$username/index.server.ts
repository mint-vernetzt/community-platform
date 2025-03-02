import { parseWithZod } from "@conform-to/zod-v1";
import { captureException } from "@sentry/remix";
import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  createImageUploadSchema,
  disconnectImageSchema,
} from "~/components/ImageCropper/ImageCropper";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { uploadFileToStorage } from "~/storage.server";
import { FILE_FIELD_NAME } from "~/storage.shared";

export type ProfileDetailLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["profile/$username/index"];

export type ProfileQuery = NonNullable<
  Awaited<ReturnType<typeof getProfileByUsername>>
>;

export async function getProfileByUsername(username: string) {
  const profile = await prismaClient.profile.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatar: true,
      background: true,
      email: true,
      email2: true,
      phone: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      xing: true,
      website: true,
      youtube: true,
      instagram: true,
      mastodon: true,
      tiktok: true,
      firstName: true,
      lastName: true,
      academicTitle: true,
      createdAt: true,
      position: true,
      bio: true,
      skills: true,
      interests: true,
      areas: { select: { area: { select: { name: true } } } },
      offers: { select: { offer: { select: { slug: true } } } },
      seekings: { select: { offer: { select: { slug: true } } } },
      memberOf: {
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
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  types: true,
                },
              },
            },
          },
        },
        orderBy: {
          organization: {
            name: "asc",
          },
        },
      },
      teamMemberOfProjects: {
        where: {
          project: {
            published: true,
          },
        },
        select: {
          project: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              responsibleOrganizations: {
                select: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      organizationVisibility: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              projectVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  responsibleOrganizations: true,
                },
              },
            },
          },
        },
        orderBy: {
          project: {
            name: "asc",
          },
        },
      },
      teamMemberOfEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participationFrom: true,
              participantLimit: true,
              stage: {
                select: {
                  slug: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
              eventVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  published: true,
                  parentEventId: true,
                  startTime: true,
                  endTime: true,
                  participationUntil: true,
                  participationFrom: true,
                  participantLimit: true,
                  stage: true,
                  canceled: true,
                  subline: true,
                  description: true,
                  background: true,
                },
              },
            },
          },
        },
        where: {
          event: {
            published: true,
          },
        },
      },
      participatedEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participationFrom: true,
              participantLimit: true,
              stage: {
                select: {
                  slug: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
              eventVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  published: true,
                  parentEventId: true,
                  startTime: true,
                  endTime: true,
                  participationUntil: true,
                  participationFrom: true,
                  participantLimit: true,
                  stage: true,
                  canceled: true,
                  subline: true,
                  description: true,
                  background: true,
                },
              },
            },
          },
        },
        where: {
          event: {
            published: true,
          },
        },
      },
      contributedEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participationFrom: true,
              participantLimit: true,
              stage: {
                select: {
                  slug: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
              eventVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  published: true,
                  parentEventId: true,
                  startTime: true,
                  endTime: true,
                  participationUntil: true,
                  participationFrom: true,
                  participantLimit: true,
                  stage: true,
                  canceled: true,
                  subline: true,
                  description: true,
                  background: true,
                },
              },
            },
          },
        },
        where: {
          event: {
            published: true,
          },
        },
      },
      waitingForEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participationFrom: true,
              participantLimit: true,
              stage: {
                select: {
                  slug: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
              eventVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  published: true,
                  parentEventId: true,
                  startTime: true,
                  endTime: true,
                  participationUntil: true,
                  participationFrom: true,
                  participantLimit: true,
                  stage: true,
                  canceled: true,
                  subline: true,
                  description: true,
                  background: true,
                },
              },
            },
          },
        },
        where: {
          event: {
            published: true,
          },
        },
      },
      administeredEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participationFrom: true,
              participantLimit: true,
              stage: {
                select: {
                  slug: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
              eventVisibility: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  published: true,
                  parentEventId: true,
                  startTime: true,
                  endTime: true,
                  participationUntil: true,
                  participationFrom: true,
                  participantLimit: true,
                  stage: true,
                  canceled: true,
                  subline: true,
                  description: true,
                  background: true,
                },
              },
            },
          },
        },
      },
      profileVisibility: {
        select: {
          id: true,
          username: true,
          avatar: true,
          background: true,
          email: true,
          email2: true,
          phone: true,
          facebook: true,
          linkedin: true,
          twitter: true,
          xing: true,
          website: true,
          youtube: true,
          instagram: true,
          firstName: true,
          lastName: true,
          academicTitle: true,
          createdAt: true,
          position: true,
          bio: true,
          skills: true,
          interests: true,
          areas: true,
          offers: true,
          seekings: true,
          memberOf: true,
          teamMemberOfProjects: true,
          teamMemberOfEvents: true,
          waitingForEvents: true,
          participatedEvents: true,
          contributedEvents: true,
        },
      },
    },
  });

  return profile;
}

export async function uploadImage(options: {
  request: Request;
  formData: FormData;
  authClient: SupabaseClient;
  username: string;
  locales: ProfileDetailLocales;
}) {
  const { request, formData, authClient, username, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createImageUploadSchema(locales).transform(async (data, ctx) => {
      const { file, bucket, uploadKey } = data;
      const { fileMetadataForDatabase, error } = await uploadFileToStorage({
        file,
        authClient,
        bucket,
      });
      if (error !== null) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      if (uploadKey !== "background" && uploadKey !== "avatar") {
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      try {
        await prismaClient.profile.update({
          where: {
            username,
          },
          data: {
            [uploadKey]: fileMetadataForDatabase.path,
          },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = new URL(request.url);
  redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  return {
    submission: null,
    toast: {
      id: "change-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.upload.success.imageAdded, {
        imageType:
          locales.upload.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function disconnectImage(options: {
  request: Request;
  formData: FormData;
  username: string;
  locales: ProfileDetailLocales;
}) {
  const { request, formData, username, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: disconnectImageSchema.transform(async (data, ctx) => {
      const { uploadKey } = data;
      try {
        if (uploadKey !== "background" && uploadKey !== "avatar") {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.onStoring,
            path: [FILE_FIELD_NAME],
          });
          return z.NEVER;
        }
        await prismaClient.profile.update({
          where: {
            username,
          },
          data: {
            [uploadKey]: null,
          },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = new URL(request.url);
  redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  return {
    submission: null,
    toast: {
      id: "disconnect-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.upload.success.imageRemoved, {
        imageType:
          locales.upload.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}
