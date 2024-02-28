import { prismaClient } from "~/prisma.server";

async function main() {
  // profiles

  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      username: true,
      offers: {
        select: {
          offer: {
            select: {
              slug: true,
            },
          },
        },
      },
      seekings: {
        select: {
          offer: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  const transactions = [];

  console.log(
    `\n--- Creating filter vectors of ${profiles.length} profiles ---`
  );

  for await (const profile of profiles) {
    if (profile.offers.length === 0 && profile.seekings.length === 0) {
      const promise = prismaClient.$queryRawUnsafe(
        `update profiles set filter_vector = NULL where id = '${profile.id}'`
      );
      transactions.push(promise);

      console.log(`Profile ${profile.username} has no offers or seekings.`);

      continue;
    }

    const offerVectors = profile.offers.map(
      (relation) => `offer:${relation.offer.slug}`
    );
    const seekingVectors = profile.seekings.map(
      (relation) => `seeking:${relation.offer.slug}`
    );
    const vectors = [...offerVectors, ...seekingVectors];
    const vectorString = `{"${vectors.join(`","`)}"}`;
    const query = `update profiles set filter_vector = array_to_tsvector('${vectorString}') where id = '${profile.id}'`;

    const promise = prismaClient.$queryRawUnsafe(query);
    transactions.push(promise);
  }

  // organizations

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  console.log(
    `\n--- Creating filter vectors of ${organizations.length} organizations ---`
  );

  for await (const organization of organizations) {
    if (organization.focuses.length === 0 && organization.types.length === 0) {
      const promise = prismaClient.$queryRawUnsafe(
        `update organizations set filter_vector = NULL where id = '${organization.id}'`
      );
      transactions.push(promise);

      console.log(`Organization ${organization.slug} has no types or focuses.`);

      continue;
    }

    const typeVectors = organization.types.map(
      (relation) => `type:${relation.organizationType.slug}`
    );
    const focusVectors = organization.focuses.map(
      (relation) => `focus:${relation.focus.slug}`
    );
    const vectors = [...typeVectors, ...focusVectors];
    const vectorString = `{"${vectors.join(`","`)}"}`;
    const query = `update organizations set filter_vector = array_to_tsvector('${vectorString}') where id = '${organization.id}'`;

    const promise = prismaClient.$queryRawUnsafe(query);
    transactions.push(promise);
  }

  // events

  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      slug: true,
      types: {
        select: {
          eventType: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      eventTargetGroups: {
        select: {
          eventTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  console.log(`\n--- Creating filter vectors of ${events.length} events ---`);

  for (const event of events) {
    if (
      event.types.length === 0 &&
      event.focuses.length === 0 &&
      event.eventTargetGroups.length === 0
    ) {
      const promise = prismaClient.$queryRawUnsafe(
        `update events set filter_vector = NULL where id = '${event.id}'`
      );
      transactions.push(promise);

      console.log(
        `Event ${event.slug} has no types, focuses or target groups.`
      );

      continue;
    }

    const typeVectors = event.types.map(
      (relation) => `type:${relation.eventType.slug}`
    );
    const focusVectors = event.focuses.map(
      (relation) => `focus:${relation.focus.slug}`
    );
    const targetGroupVectors = event.eventTargetGroups.map(
      (relation) => `eventTargetGroup:${relation.eventTargetGroup.slug}`
    );
    const vectors = [...typeVectors, ...focusVectors, ...targetGroupVectors];
    const vectorString = `{"${vectors.join(`","`)}"}`;
    const query = `update events set filter_vector = array_to_tsvector('${vectorString}') where id = '${event.id}'`;

    const promise = prismaClient.$queryRawUnsafe(query);
    transactions.push(promise);
  }

  // projects

  const projects = await prismaClient.project.findMany({
    select: {
      id: true,
      slug: true,
      disciplines: {
        select: {
          discipline: {
            select: {
              slug: true,
            },
          },
        },
      },
      projectTargetGroups: {
        select: {
          projectTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      formats: {
        select: {
          format: {
            select: {
              slug: true,
            },
          },
        },
      },
      specialTargetGroups: {
        select: {
          specialTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      financings: {
        select: {
          financing: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  console.log(
    `\n--- Creating filter vectors of ${projects.length} projects ---`
  );

  for (const project of projects) {
    if (
      project.disciplines.length === 0 &&
      project.projectTargetGroups.length === 0 &&
      project.formats.length === 0 &&
      project.specialTargetGroups.length === 0 &&
      project.financings.length === 0
    ) {
      const promise = prismaClient.$queryRawUnsafe(
        `update projects set filter_vector = NULL where id = '${project.id}'`
      );
      transactions.push(promise);

      console.log(
        `Project ${project.slug} has no disciplines, target groups, formats, special target groups or financings.`
      );

      continue;
    }

    const disciplineVectors = project.disciplines.map(
      (relation) => `discipline:${relation.discipline.slug}`
    );
    const targetGroupVectors = project.projectTargetGroups.map(
      (relation) => `projectTargetGroup:${relation.projectTargetGroup.slug}`
    );
    const formatVectors = project.formats.map(
      (relation) => `format:${relation.format.slug}`
    );
    const specialTargetGroupVectors = project.specialTargetGroups.map(
      (relation) => `specialTargetGroup:${relation.specialTargetGroup.slug}`
    );
    const financingVectors = project.financings.map(
      (relation) => `financing:${relation.financing.slug}`
    );
    const vectors = [
      ...disciplineVectors,
      ...targetGroupVectors,
      ...formatVectors,
      ...specialTargetGroupVectors,
      ...financingVectors,
    ];
    const vectorString = `{"${vectors.join(`","`)}"}`;
    const query = `update projects set filter_vector = array_to_tsvector('${vectorString}') where id = '${project.id}'`;

    const promise = prismaClient.$queryRawUnsafe(query);
    transactions.push(promise);
  }

  await prismaClient.$transaction(transactions);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
    console.log("\ndone.");
  });
