import { parseWithZod } from "@conform-to/zod-v1";
import { type Prisma, type Profile } from "@prisma/client";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { type TFunction } from "i18next";
import { redirect } from "react-router-dom";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { filterProfileByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";
import { getPublicURL } from "~/storage.server";
import { deriveMode } from "~/utils.server";

export const i18nNS = ["routes/profile/search"];

export const handle = {
  i18n: i18nNS,
};

export const searchSchema = (t: TFunction) => {
  return z.object({
    search: z
      .string()
      .min(3, { message: t("validation.min") })
      .optional(),
    noJS: z.string().optional(),
    redirectToWithNoJS: z
      .string()
      .refine((value) => {
        return value.startsWith("/");
      })
      .optional(),
  });
};

export const searchResponseSchema = z.array(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    avatar: z.string().nullable(),
    blurredAvatar: z.string().optional(),
    profileVisibility: z
      .object({
        firstName: z.boolean(),
        lastName: z.boolean(),
        username: z.boolean(),
        avatar: z.boolean(),
      })
      .nullable(),
  })
);

// type Test = SubmissionResult;

export const NoJsSearchParam = "search-without-js";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const mode = deriveMode(sessionUser);

  const searchParams = new URL(request.url).searchParams;
  const submission = parseWithZod(searchParams, { schema: searchSchema(t) });
  if (
    submission.status !== "success" ||
    submission.value.search === undefined
  ) {
    const responseJSON = {
      submission: submission.reply(),
    };
    if (
      submission.payload.noJS === "true" &&
      typeof submission.payload.redirectToWithNoJS === "string" &&
      submission.payload.redirectToWithNoJS.startsWith("/")
    ) {
      return redirect(
        `${submission.payload.redirectToWithNoJS}?${encodeURIComponent(
          JSON.stringify(responseJSON)
        )}`
      );
    }
    return responseJSON;
  }

  const query = submission.value.search.split(" ");
  const whereQueries: {
    OR: {
      [K in Profile as string]: { contains: string; mode: Prisma.QueryMode };
    }[];
  }[] = [];
  for (const word of query) {
    whereQueries.push({
      OR: [
        { firstName: { contains: word, mode: "insensitive" } },
        { lastName: { contains: word, mode: "insensitive" } },
        { username: { contains: word, mode: "insensitive" } },
        { email: { contains: word, mode: "insensitive" } },
      ],
    });
  }
  const searchResult = await prismaClient.profile.findMany({
    where: {
      AND: whereQueries,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      avatar: true,
      profileVisibility: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
          avatar: true,
        },
      },
    },
    take: 10,
  });

  let filteredSearchResult;
  if (mode === "anon") {
    filteredSearchResult = searchResult.map((profile) => {
      return filterProfileByVisibility<typeof profile>(profile);
    });
  } else {
    filteredSearchResult = searchResult;
  }

  const enhancedSearchResult = filteredSearchResult.map((relation) => {
    let avatar = relation.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItemProjectDetailAndSettings.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItemProjectDetailAndSettings
              .BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...relation, avatar, blurredAvatar };
  });

  const responseJSON = {
    searchResult: enhancedSearchResult,
    submission,
  };

  if (
    submission.value.noJS === "true" &&
    submission.value.redirectToWithNoJS !== undefined
  ) {
    return redirect(
      `${submission.payload.redirectToWithNoJS}?${encodeURIComponent(
        JSON.stringify(responseJSON)
      )}`
    );
  }

  return responseJSON;
};
