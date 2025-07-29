import { prismaClient } from "~/prisma.server";
import {
  getSlugFromLocaleThatContainsWord,
  detectLanguage as nextDetectLanguage,
} from "./i18n.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "./i18n.shared";
import { type ArrayElement } from "./lib/utils/types";
import { languageModuleMap } from "./locales/.server";

export async function getProfileByUserId(id: string) {
  return await prismaClient.profile.findUnique({
    select: {
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      termsAccepted: true,
    },
    where: {
      id,
    },
  });
}

export type RootLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["root"];

export function detectLanguage(request: Request) {
  return nextDetectLanguage(request);
}

export async function getProfileTagsBySearchQuery(
  searchQuery: string,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  // Get all tags that match the search query and have entities associated with them
  // Categories are areas, offers and seekings
  const slugs: Array<string> = [];
  const words = searchQuery.split(" ");
  for (const word of words) {
    const offerOrSeekingSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "offers",
    }) as keyof (typeof languageModuleMap)[ArrayElement<
      typeof SUPPORTED_COOKIE_LANGUAGES
    >]["offers"];
    if (typeof offerOrSeekingSlug !== "undefined") {
      slugs.push(offerOrSeekingSlug);
    }
  }

  const [offerAndSeekingSlugs, areas] = await prismaClient.$transaction([
    prismaClient.offer.findMany({
      where: {
        AND: [
          {
            slug: {
              in: slugs,
            },
          },
          {
            OR: [
              {
                OffersOnProfiles: {
                  some: {},
                },
              },
              {
                SeekingsOnProfiles: {
                  some: {},
                },
              },
            ],
          },
        ],
      },
      select: {
        slug: true,
      },
    }),

    prismaClient.area.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
        AreasOnProfiles: {
          some: {},
        },
      },
      select: {
        name: true,
      },
    }),
  ]);
  const offersAndSeekings = offerAndSeekingSlugs.map((offer) => {
    return {
      title:
        languageModuleMap[language].offers[
          offer.slug as keyof (typeof languageModuleMap)[typeof language]["offers"]
        ].title,
    };
  });

  const normalizedAreas = areas.map((area) => {
    return {
      title: area.name,
    };
  });

  return [...offersAndSeekings, ...normalizedAreas];
}

export async function getOrganizationTagsBySearchQuery(
  searchQuery: string,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  // Get all tags that match the search query and have entities associated with them
  // Categories are focuses, organizationTypes and networkTypes
  const focusSlugs: Array<string> = [];
  const organizationTypeSlugs: Array<string> = [];
  const networkTypeSlugs: Array<string> = [];
  const words = searchQuery.split(" ");
  for (const word of words) {
    const focusSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "focuses",
    });
    if (typeof focusSlug !== "undefined") {
      focusSlugs.push(focusSlug);
    }
    const organizationTypeSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "organizationTypes",
      word,
    });
    if (typeof organizationTypeSlug !== "undefined") {
      organizationTypeSlugs.push(organizationTypeSlug);
    }
    const networkTypeSlug = getSlugFromLocaleThatContainsWord({
      language,
      locales: "networkTypes",
      word,
    });
    if (typeof networkTypeSlug !== "undefined") {
      networkTypeSlugs.push(networkTypeSlug);
    }
  }

  const [focuses, organizationTypes, networkTypes, areas] =
    await prismaClient.$transaction([
      prismaClient.focus.findMany({
        where: {
          AND: [
            {
              slug: {
                in: focusSlugs,
              },
            },
            {
              OR: [
                {
                  organizations: {
                    some: {},
                  },
                },
              ],
            },
          ],
        },
        select: {
          slug: true,
        },
      }),
      prismaClient.organizationType.findMany({
        where: {
          AND: [
            {
              slug: {
                in: organizationTypeSlugs,
              },
            },
            {
              OR: [
                {
                  organizations: {
                    some: {},
                  },
                },
              ],
            },
          ],
        },
        select: {
          slug: true,
        },
      }),
      prismaClient.networkType.findMany({
        where: {
          AND: [
            {
              slug: {
                in: networkTypeSlugs,
              },
            },
            {
              OR: [
                {
                  organizations: {
                    some: {},
                  },
                },
              ],
            },
          ],
        },
        select: {
          slug: true,
        },
      }),

      prismaClient.area.findMany({
        where: {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
          AreasOnProfiles: {
            some: {},
          },
        },
        select: {
          name: true,
        },
      }),
    ]);

  const normalizedFocuses = focuses.map((focus) => {
    return {
      title:
        languageModuleMap[language].focuses[
          focus.slug as keyof (typeof languageModuleMap)[typeof language]["focuses"]
        ].title,
    };
  });
  const normalizedOrganizationTypes = organizationTypes.map(
    (organizationType) => {
      return {
        title:
          languageModuleMap[language].organizationTypes[
            organizationType.slug as keyof (typeof languageModuleMap)[typeof language]["organizationTypes"]
          ].title,
      };
    }
  );
  const normalizedNetworkTypes = networkTypes.map((networkType) => {
    return {
      title:
        languageModuleMap[language].networkTypes[
          networkType.slug as keyof (typeof languageModuleMap)[typeof language]["networkTypes"]
        ].title,
    };
  });
  const normalizedAreas = areas.map((area) => {
    return {
      title: area.name,
    };
  });
  return [
    ...normalizedFocuses,
    ...normalizedOrganizationTypes,
    ...normalizedNetworkTypes,
    ...normalizedAreas,
  ];
}

export async function getProjectTagsBySearchQuery(
  searchQuery: string,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  // Get all tags that match the search query and have entities associated with them
  // Categories are focuses, organizationTypes and networkTypes
  const disciplineSlugs: Array<string> = [];
  const targetGroupsSlugs: Array<string> = [];
  const formatSlugs: Array<string> = [];
  const furtherTargetGroupsSlugs: Array<string> = [];
  const financingSlugs: Array<string> = [];

  const words = searchQuery.trim().split(" ");
  for (const word of words) {
    const disciplineSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "disciplines",
    });
    if (typeof disciplineSlug !== "undefined") {
      disciplineSlugs.push(disciplineSlug);
    }
    const targetGroupSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "projectTargetGroups",
    });
    if (typeof targetGroupSlug !== "undefined") {
      targetGroupsSlugs.push(targetGroupSlug);
    }
    const formatSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "formats",
    });
    if (typeof formatSlug !== "undefined") {
      formatSlugs.push(formatSlug);
    }
    const furtherTargetGroupSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "specialTargetGroups",
    });
    if (typeof furtherTargetGroupSlug !== "undefined") {
      furtherTargetGroupsSlugs.push(furtherTargetGroupSlug);
    }
    const financingSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "financings",
    });
    if (typeof financingSlug !== "undefined") {
      financingSlugs.push(financingSlug);
    }
  }

  const [
    disciplines,
    targetGroups,
    formats,
    furtherTargetGroups,
    financings,
    areas,
  ] = await prismaClient.$transaction([
    prismaClient.discipline.findMany({
      where: {
        AND: [
          {
            slug: {
              in: disciplineSlugs,
            },
          },
          {
            projects: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.projectTargetGroup.findMany({
      where: {
        AND: [
          {
            slug: {
              in: targetGroupsSlugs,
            },
          },
          {
            projects: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.format.findMany({
      where: {
        AND: [
          {
            slug: {
              in: formatSlugs,
            },
          },
          {
            projects: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.specialTargetGroup.findMany({
      where: {
        AND: [
          {
            slug: {
              in: furtherTargetGroupsSlugs,
            },
          },
          {
            projects: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.financing.findMany({
      where: {
        AND: [
          {
            slug: {
              in: financingSlugs,
            },
          },
          {
            projects: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.area.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
        AreasOnProfiles: {
          some: {},
        },
      },
      select: {
        name: true,
      },
    }),
  ]);

  const normalizedDisciplines = disciplines.map((discipline) => {
    return {
      title:
        languageModuleMap[language].disciplines[
          discipline.slug as keyof (typeof languageModuleMap)[typeof language]["disciplines"]
        ].title,
    };
  });
  const normalizedTargetGroups = targetGroups.map((targetGroup) => {
    return {
      title:
        languageModuleMap[language].projectTargetGroups[
          targetGroup.slug as keyof (typeof languageModuleMap)[typeof language]["projectTargetGroups"]
        ].title,
    };
  });
  const normalizedFormats = formats.map((format) => {
    return {
      title:
        languageModuleMap[language].formats[
          format.slug as keyof (typeof languageModuleMap)[typeof language]["formats"]
        ].title,
    };
  });
  const normalizedFurtherTargetGroups = furtherTargetGroups.map(
    (furtherTargetGroup) => {
      return {
        title:
          languageModuleMap[language].specialTargetGroups[
            furtherTargetGroup.slug as keyof (typeof languageModuleMap)[typeof language]["specialTargetGroups"]
          ].title,
      };
    }
  );
  const normalizedFinancings = financings.map((financing) => {
    return {
      title:
        languageModuleMap[language].financings[
          financing.slug as keyof (typeof languageModuleMap)[typeof language]["financings"]
        ].title,
    };
  });
  const normalizedAreas = areas.map((area) => {
    return {
      title: area.name,
    };
  });
  return [
    ...normalizedDisciplines,
    ...normalizedTargetGroups,
    ...normalizedFormats,
    ...normalizedFurtherTargetGroups,
    ...normalizedFinancings,
    ...normalizedAreas,
  ];
}

export async function getEventTagsBySearchQuery(
  searchQuery: string,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  // Get all tags that match the search query and have entities associated with them
  // Categories are eventTypes, focuses, tags, eventTargetGroups, experienceLevels and stages
  const eventTypeSlugs: Array<string> = [];
  const focusSlugs: Array<string> = [];
  const tagSlugs: Array<string> = [];
  const eventTargetGroupSlugs: Array<string> = [];
  const experienceLevelSlugs: Array<string> = [];
  const stageSlugs: Array<string> = [];

  const words = searchQuery.trim().split(" ");

  for (const word of words) {
    const eventTypeSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "eventTypes",
    });
    if (typeof eventTypeSlug !== "undefined") {
      eventTypeSlugs.push(eventTypeSlug);
    }
    const focusSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "focuses",
    });
    if (typeof focusSlug !== "undefined") {
      focusSlugs.push(focusSlug);
    }
    const tagSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "tags",
    });
    if (typeof tagSlug !== "undefined") {
      tagSlugs.push(tagSlug);
    }
    const eventTargetGroupSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "eventTargetGroups",
    });
    if (typeof eventTargetGroupSlug !== "undefined") {
      eventTargetGroupSlugs.push(eventTargetGroupSlug);
    }
    const experienceLevelSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "experienceLevels",
    });
    if (typeof experienceLevelSlug !== "undefined") {
      experienceLevelSlugs.push(experienceLevelSlug);
    }
    const stageSlug = getSlugFromLocaleThatContainsWord({
      word,
      language,
      locales: "stages",
    });
    if (typeof stageSlug !== "undefined") {
      stageSlugs.push(stageSlug);
    }
  }

  const [
    eventTypes,
    focuses,
    tags,
    eventTargetGroups,
    experienceLevels,
    stages,
    areas,
  ] = await prismaClient.$transaction([
    prismaClient.eventType.findMany({
      where: {
        AND: [
          {
            slug: {
              in: eventTypeSlugs,
            },
          },
          {
            events: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.focus.findMany({
      where: {
        AND: [
          {
            slug: {
              in: focusSlugs,
            },
          },
          {
            events: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.tag.findMany({
      where: {
        AND: [
          {
            slug: {
              in: tagSlugs,
            },
          },
          {
            events: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.eventTargetGroup.findMany({
      where: {
        AND: [
          {
            slug: {
              in: eventTargetGroupSlugs,
            },
          },
          {
            events: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.experienceLevel.findMany({
      where: {
        AND: [
          {
            slug: {
              in: experienceLevelSlugs,
            },
          },
          {
            events: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.stage.findMany({
      where: {
        AND: [
          {
            slug: {
              in: stageSlugs,
            },
          },
          {
            events: {
              some: {},
            },
          },
        ],
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.area.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
        AreasOnProfiles: {
          some: {},
        },
      },
      select: {
        name: true,
      },
    }),
  ]);

  const normalizedEventTypes = eventTypes.map((eventType) => {
    return {
      title:
        languageModuleMap[language].eventTypes[
          eventType.slug as keyof (typeof languageModuleMap)[typeof language]["eventTypes"]
        ].title,
    };
  });
  const normalizedFocuses = focuses.map((focus) => {
    return {
      title:
        languageModuleMap[language].focuses[
          focus.slug as keyof (typeof languageModuleMap)[typeof language]["focuses"]
        ].title,
    };
  });
  const normalizedTags = tags.map((tag) => {
    return {
      title:
        languageModuleMap[language].tags[
          tag.slug as keyof (typeof languageModuleMap)[typeof language]["tags"]
        ].title,
    };
  });
  const normalizedEventTargetGroups = eventTargetGroups.map(
    (eventTargetGroup) => {
      return {
        title:
          languageModuleMap[language].eventTargetGroups[
            eventTargetGroup.slug as keyof (typeof languageModuleMap)[typeof language]["eventTargetGroups"]
          ].title,
      };
    }
  );
  const normalizedExperienceLevels = experienceLevels.map((experienceLevel) => {
    return {
      title:
        languageModuleMap[language].experienceLevels[
          experienceLevel.slug as keyof (typeof languageModuleMap)[typeof language]["experienceLevels"]
        ].title,
    };
  });
  const normalizedStages = stages.map((stage) => {
    return {
      title:
        languageModuleMap[language].stages[
          stage.slug as keyof (typeof languageModuleMap)[typeof language]["stages"]
        ].title,
    };
  });
  const normalizedAreas = areas.map((area) => {
    return {
      title: area.name,
    };
  });
  return [
    ...normalizedEventTypes,
    ...normalizedFocuses,
    ...normalizedTags,
    ...normalizedEventTargetGroups,
    ...normalizedExperienceLevels,
    ...normalizedStages,
    ...normalizedAreas,
  ];
}

export async function getFundingTagsBySearchQuery(searchQuery: string) {
  // Get all tags that match the search query and have entities associated with them
  // Categories are regions, funders, types, areas and eligible entities
  const words = searchQuery
    .trim()
    .split(" ")
    .filter((word) => {
      return word.length > 0;
    });
  const [regions, funders, types, areas, eligibleEntities] =
    await prismaClient.$transaction([
      prismaClient.fundingArea.findMany({
        where: {
          OR: [
            {
              AND: words.map((word) => {
                return {
                  title: {
                    contains: word,
                    mode: "insensitive",
                  },
                  fundings: { some: {} },
                };
              }),
            },
          ],
        },
        select: {
          title: true,
        },
      }),
      prismaClient.funder.findMany({
        where: {
          OR: [
            {
              AND: words.map((word) => {
                return {
                  title: {
                    contains: word,
                    mode: "insensitive",
                  },
                  fundings: { some: {} },
                };
              }),
            },
          ],
        },
        select: {
          title: true,
        },
      }),
      prismaClient.fundingType.findMany({
        where: {
          OR: [
            {
              AND: words.map((word) => {
                return {
                  title: {
                    contains: word,
                    mode: "insensitive",
                  },
                  fundings: { some: {} },
                };
              }),
            },
          ],
        },
        select: {
          title: true,
        },
      }),
      prismaClient.area.findMany({
        where: {
          OR: [
            {
              AND: words.map((word) => {
                return {
                  name: {
                    contains: word,
                    mode: "insensitive",
                  },
                  AreasOnFundings: { some: {} },
                };
              }),
            },
          ],
        },
        select: {
          name: true,
        },
      }),
      prismaClient.fundingEligibleEntity.findMany({
        where: {
          OR: [
            {
              AND: words.map((word) => {
                return {
                  title: {
                    contains: word,
                    mode: "insensitive",
                  },
                  fundings: { some: {} },
                };
              }),
            },
          ],
        },
        select: {
          title: true,
        },
      }),
    ]);

  const normalizedAreas = areas.map((area) => {
    return {
      title: area.name,
    };
  });

  return [
    ...regions,
    ...funders,
    ...types,
    ...eligibleEntities,
    ...normalizedAreas,
  ];
}

export async function getTagsBySearchQuery(
  searchQuery: string,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>
) {
  const profileTags =
    searchQuery !== null
      ? await getProfileTagsBySearchQuery(searchQuery, language)
      : [];
  const organizationTags =
    searchQuery !== null
      ? await getOrganizationTagsBySearchQuery(searchQuery, language)
      : [];
  const eventTags =
    searchQuery !== null
      ? await getEventTagsBySearchQuery(searchQuery, language)
      : [];
  const projectTags =
    searchQuery !== null
      ? await getProjectTagsBySearchQuery(searchQuery, language)
      : [];
  const fundingTags =
    searchQuery !== null ? await getFundingTagsBySearchQuery(searchQuery) : [];

  // Create alternately tags array from profile and organization tags
  const tags: {
    type: "profile" | "organization" | "event" | "project" | "funding";
    title: string;
  }[] = [];
  const maxTags = 7;
  let profileTagsIndex = 0;
  let organizationTagsIndex = 0;
  let eventTagsIndex = 0;
  let projectTagsIndex = 0;
  let fundingTagsIndex = 0;

  while (tags.length < maxTags) {
    if (profileTagsIndex < profileTags.length) {
      tags.push({
        type: "profile",
        title: profileTags[profileTagsIndex].title,
      });
      profileTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (organizationTagsIndex < organizationTags.length) {
      tags.push({
        type: "organization",
        title: organizationTags[organizationTagsIndex].title,
      });
      organizationTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (eventTagsIndex < eventTags.length) {
      tags.push({
        type: "event",
        title: eventTags[eventTagsIndex].title,
      });
      eventTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (projectTagsIndex < projectTags.length) {
      tags.push({
        type: "project",
        title: projectTags[projectTagsIndex].title,
      });
      projectTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (fundingTagsIndex < fundingTags.length) {
      tags.push({
        type: "funding",
        title: fundingTags[fundingTagsIndex].title,
      });
      fundingTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (
      profileTagsIndex >= profileTags.length &&
      organizationTagsIndex >= organizationTags.length &&
      projectTagsIndex >= projectTags.length &&
      eventTagsIndex >= eventTags.length &&
      fundingTagsIndex >= fundingTags.length
    ) {
      break;
    }
  }

  return tags;
}
