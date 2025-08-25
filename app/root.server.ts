import { prismaClient } from "~/prisma.server";
import {
  getAllSlugsFromLocaleThatContainsWord,
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
    const offerOrSeekingSlugs = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "offers",
    }) as (keyof (typeof languageModuleMap)[ArrayElement<
      typeof SUPPORTED_COOKIE_LANGUAGES
    >]["offers"])[];
    slugs.push(...offerOrSeekingSlugs);
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
    const focusSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "focuses",
    });
    focusSlugs.push(...focusSlugsForWord);
    const organizationTypeSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "organizationTypes",
      word,
    });
    organizationTypeSlugs.push(...organizationTypeSlugsForWord);
    const networkTypeSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      language,
      locales: "networkTypes",
      word,
    });
    networkTypeSlugs.push(...networkTypeSlugsForWord);
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
              organizations: {
                some: {},
              },
            },
          ],
        },
        select: {
          slug: true,
        },
      }),
      prismaClient.organizationType.findMany({
        where: {
          slug: {
            in: organizationTypeSlugs,
          },
          organizations: {
            some: {},
          },
        },
        select: {
          slug: true,
        },
      }),
      prismaClient.networkType.findMany({
        where: {
          slug: {
            in: networkTypeSlugs,
          },
          organizations: {
            some: {},
          },
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
    const disciplineSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "disciplines",
    });

    disciplineSlugs.push(...disciplineSlugsForWord);
    const targetGroupSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "projectTargetGroups",
    });
    targetGroupsSlugs.push(...targetGroupSlugsForWord);
    const formatSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "formats",
    });
    formatSlugs.push(...formatSlugsForWord);
    const furtherTargetGroupSlugsForWord =
      getAllSlugsFromLocaleThatContainsWord({
        word,
        language,
        locales: "specialTargetGroups",
      });
    furtherTargetGroupsSlugs.push(...furtherTargetGroupSlugsForWord);
    const financingSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "financings",
    });
    financingSlugs.push(...financingSlugsForWord);
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
        slug: {
          in: disciplineSlugs,
        },
        projects: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.projectTargetGroup.findMany({
      where: {
        slug: {
          in: targetGroupsSlugs,
        },
        projects: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.format.findMany({
      where: {
        slug: {
          in: formatSlugs,
        },
        projects: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.specialTargetGroup.findMany({
      where: {
        slug: {
          in: furtherTargetGroupsSlugs,
        },
        projects: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.financing.findMany({
      where: {
        slug: {
          in: financingSlugs,
        },
        projects: {
          some: {},
        },
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
    const eventTypeSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "eventTypes",
    });

    eventTypeSlugs.push(...eventTypeSlugsForWord);
    const focusSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "focuses",
    });

    focusSlugs.push(...focusSlugsForWord);
    const tagSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "tags",
    });
    tagSlugs.push(...tagSlugsForWord);
    const eventTargetGroupSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "eventTargetGroups",
    });
    eventTargetGroupSlugs.push(...eventTargetGroupSlugsForWord);
    const experienceLevelSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "experienceLevels",
    });
    experienceLevelSlugs.push(...experienceLevelSlugsForWord);
    const stageSlugsForWord = getAllSlugsFromLocaleThatContainsWord({
      word,
      language,
      locales: "stages",
    });
    stageSlugs.push(...stageSlugsForWord);
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
        slug: {
          in: eventTypeSlugs,
        },
        events: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.focus.findMany({
      where: {
        slug: {
          in: focusSlugs,
        },
        events: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.tag.findMany({
      where: {
        slug: {
          in: tagSlugs,
        },
        events: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.eventTargetGroup.findMany({
      where: {
        slug: {
          in: eventTargetGroupSlugs,
        },
        events: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.experienceLevel.findMany({
      where: {
        slug: {
          in: experienceLevelSlugs,
        },
        events: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
    prismaClient.stage.findMany({
      where: {
        slug: {
          in: stageSlugs,
        },
        events: {
          some: {},
        },
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
  // Categories are funding areas, funders, types, regions and eligible entities
  const words = searchQuery
    .trim()
    .split(" ")
    .filter((word) => {
      return word.length > 0;
    });
  const [fundingAreas, funders, types, regions, eligibleEntities] =
    await prismaClient.$transaction([
      prismaClient.fundingArea.findMany({
        where: {
          OR: words.map((word) => {
            return {
              title: {
                contains: word,
                mode: "insensitive",
              },
            };
          }),
          fundings: { some: {} },
        },
        select: {
          title: true,
        },
      }),
      prismaClient.funder.findMany({
        where: {
          OR: words.map((word) => {
            return {
              title: {
                contains: word,
                mode: "insensitive",
              },
            };
          }),
          fundings: { some: {} },
        },
        select: {
          title: true,
        },
      }),
      prismaClient.fundingType.findMany({
        where: {
          OR: words.map((word) => {
            return {
              title: {
                contains: word,
                mode: "insensitive",
              },
            };
          }),
          fundings: { some: {} },
        },
        select: {
          title: true,
        },
      }),
      prismaClient.fundingRegion.findMany({
        where: {
          OR: words.map((word) => {
            return {
              title: {
                contains: word,
                mode: "insensitive",
              },
            };
          }),
          fundings: { some: {} },
        },
        select: {
          title: true,
        },
      }),
      prismaClient.fundingEligibleEntity.findMany({
        where: {
          OR: words.map((word) => {
            return {
              title: {
                contains: word,
                mode: "insensitive",
              },
            };
          }),
          fundings: { some: {} },
        },
        select: {
          title: true,
        },
      }),
    ]);

  return [
    ...fundingAreas,
    ...funders,
    ...types,
    ...eligibleEntities,
    ...regions,
  ];
}

export async function getProfilesBySearchQuery(searchQuery: string) {
  const words = searchQuery.split(" ").filter((word) => {
    return word.length > 0 && word !== "";
  });

  const profiles = await prismaClient.profile.findMany({
    where: {
      OR: words.map((word) => {
        return {
          OR: [
            {
              firstName: {
                contains: word,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: word,
                mode: "insensitive",
              },
            },
          ],
        };
      }),
    },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      avatar: true,
    },
  });

  const normalizedProfiles = profiles.map((profile) => {
    const name = `${profile.firstName} ${profile.lastName}`;
    const url = `/profile/${profile.username}`;
    const logo = profile.avatar;

    return {
      name,
      url,
      logo,
    };
  });

  return normalizedProfiles;
}

export async function getOrganizationsBySearchQuery(searchQuery: string) {
  const words = searchQuery.split(" ").filter((word) => {
    return word.length > 0 && word !== "";
  });

  const organizations = await prismaClient.organization.findMany({
    where: {
      OR: words.map((word) => {
        return {
          name: {
            contains: word,
            mode: "insensitive",
          },
        };
      }),
    },
    select: {
      name: true,
      slug: true,
      logo: true,
    },
  });

  const normalizedOrganizations = organizations.map((organization) => {
    const name = organization.name;
    const url = `/organization/${organization.slug}`;
    const logo = organization.logo;

    return {
      name,
      url,
      logo,
    };
  });

  return normalizedOrganizations;
}

export async function getEventsBySearchQuery(searchQuery: string) {
  const words = searchQuery.split(" ").filter((word) => {
    return word.length > 0 && word !== "";
  });

  const events = await prismaClient.event.findMany({
    where: {
      OR: words.map((word) => {
        return {
          name: {
            contains: word,
            mode: "insensitive",
          },
        };
      }),
    },
    select: {
      name: true,
      slug: true,
      background: true,
    },
  });

  const normalizedEvents = events.map((event) => {
    const name = event.name;
    const url = `/event/${event.slug}`;
    const logo = event.background;

    return {
      name,
      url,
      logo,
    };
  });

  return normalizedEvents;
}

export async function getProjectsBySearchQuery(searchQuery: string) {
  const words = searchQuery.split(" ").filter((word) => {
    return word.length > 0 && word !== "";
  });

  const projects = await prismaClient.project.findMany({
    where: {
      OR: words.map((word) => {
        return {
          name: {
            contains: word,
            mode: "insensitive",
          },
        };
      }),
    },
    select: {
      name: true,
      slug: true,
      logo: true,
    },
  });

  const normalizedProjects = projects.map((project) => {
    const name = project.name;
    const url = `/project/${project.slug}`;
    const logo = project.logo;

    return {
      name,
      url,
      logo,
    };
  });

  return normalizedProjects;
}

export async function getFundingsBySearchQuery(searchQuery: string) {
  const words = searchQuery.split(" ").filter((word) => {
    return word.length > 0 && word !== "";
  });

  const fundings = await prismaClient.funding.findMany({
    where: {
      OR: words.map((word) => {
        return {
          title: {
            contains: word,
            mode: "insensitive",
          },
        };
      }),
    },
    select: {
      title: true,
      url: true,
    },
  });

  const normalizedFundings = fundings.map((funding) => {
    const name = funding.title;
    const url = funding.url;

    return {
      name,
      url,
    };
  });

  return normalizedFundings;
}

export async function getEntitiesBySearchQuery(searchQuery: string) {
  const profiles = await getProfilesBySearchQuery(searchQuery);
  const organizations = await getOrganizationsBySearchQuery(searchQuery);
  const events = await getEventsBySearchQuery(searchQuery);
  const projects = await getProjectsBySearchQuery(searchQuery);
  const fundings = await getFundingsBySearchQuery(searchQuery);
  const entities: {
    type: "profile" | "organization" | "event" | "project" | "funding";
    name: string;
    url: string;
    logo?: string | null;
  }[] = [];

  const maxEntities = 7;
  let profileIndex = 0;
  let organizationIndex = 0;
  let eventIndex = 0;
  let projectIndex = 0;
  let fundingIndex = 0;

  while (entities.length < maxEntities) {
    if (profileIndex < profiles.length) {
      entities.push({
        type: "profile",
        ...profiles[profileIndex],
      });
      profileIndex++;
      if (entities.length >= maxEntities) {
        break;
      }
    }
    if (organizationIndex < organizations.length) {
      entities.push({
        type: "organization",
        ...organizations[organizationIndex],
      });
      organizationIndex++;
      if (entities.length >= maxEntities) {
        break;
      }
    }
    if (eventIndex < events.length) {
      entities.push({
        type: "event",
        ...events[eventIndex],
      });
      eventIndex++;
      if (entities.length >= maxEntities) {
        break;
      }
    }

    if (projectIndex < projects.length) {
      entities.push({
        type: "project",
        ...projects[projectIndex],
      });
      projectIndex++;
      if (entities.length >= maxEntities) {
        break;
      }
    }

    if (fundingIndex < fundings.length) {
      entities.push({
        type: "funding",
        ...fundings[fundingIndex],
      });
      fundingIndex++;
      if (entities.length >= maxEntities) {
        break;
      }
    }

    if (
      profileIndex >= profiles.length &&
      organizationIndex >= organizations.length &&
      eventIndex >= events.length &&
      projectIndex >= projects.length &&
      fundingIndex >= fundings.length
    ) {
      break;
    }
  }

  return entities;
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
    type: "profiles" | "organizations" | "events" | "projects" | "fundings";
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
        type: "profiles",
        title: profileTags[profileTagsIndex].title,
      });
      profileTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (organizationTagsIndex < organizationTags.length) {
      tags.push({
        type: "organizations",
        title: organizationTags[organizationTagsIndex].title,
      });
      organizationTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (eventTagsIndex < eventTags.length) {
      tags.push({
        type: "events",
        title: eventTags[eventTagsIndex].title,
      });
      eventTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (projectTagsIndex < projectTags.length) {
      tags.push({
        type: "projects",
        title: projectTags[projectTagsIndex].title,
      });
      projectTagsIndex++;
      if (tags.length >= maxTags) {
        break;
      }
    }
    if (fundingTagsIndex < fundingTags.length) {
      tags.push({
        type: "fundings",
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
