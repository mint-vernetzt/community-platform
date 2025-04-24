import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { List } from "@mint-vernetzt/components/src/organisms/List";
import { Video } from "@mint-vernetzt/components/src/organisms/Video";
import { type HeadersArgs, type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { createAuthClient } from "~/auth.server";
import { RichText } from "~/components/Richtext/RichText";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { Avatar as AvatarIcon } from "~/components-next/Avatar";
import { Envelope } from "~/components-next/icons/Envelope";
import { Facebook } from "~/components-next/icons/Facebook";
import { Globe } from "~/components-next/icons/Globe";
import { House } from "~/components-next/icons/House";
import { Instagram } from "~/components-next/icons/Instagram";
import { LinkedIn } from "~/components-next/icons/LinkedIn";
import { Mastodon } from "~/components-next/icons/Mastodon";
import { Phone } from "~/components-next/icons/Phone";
import { TikTok } from "~/components-next/icons/TikTok";
import { Twitter } from "~/components-next/icons/Twitter";
import { Xing } from "~/components-next/icons/Xing";
import { YouTube } from "~/components-next/icons/YouTube";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export function headers({ parentHeaders }: HeadersArgs) {
  parentHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
  return parentHeaders;
}

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["project/$slug/detail/about"];

  const { authClient } = createAuthClient(request);

  // check slug exists (throw bad request if not)
  invariantResponse(
    params.slug !== undefined,
    locales.route.error.invariant.invalidRoute,
    {
      status: 400,
    }
  );

  const project = await prismaClient.project.findFirst({
    where: {
      slug: params.slug,
    },
    select: {
      name: true,
      excerpt: true,
      logo: true,
      email: true,
      phone: true,
      website: true,
      contactName: true,
      street: true,
      streetNumber: true,
      streetNumberAddition: true,
      zipCode: true,
      city: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      youtube: true,
      instagram: true,
      xing: true,
      mastodon: true,
      tiktok: true,
      formats: {
        select: {
          format: {
            select: {
              slug: true,
            },
          },
        },
      },
      furtherFormats: true,
      disciplines: {
        select: {
          discipline: {
            select: {
              slug: true,
            },
          },
        },
      },
      additionalDisciplines: {
        select: {
          additionalDiscipline: {
            select: {
              slug: true,
            },
          },
        },
      },
      furtherDisciplines: true,
      projectTargetGroups: {
        select: {
          projectTargetGroup: {
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
      targetGroupAdditions: true,
      participantLimit: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      furtherDescription: true,
      idea: true,
      goals: true,
      implementation: true,
      targeting: true,
      hints: true,
      video: true,
      videoSubline: true,
      teamMembers: {
        select: {
          profile: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              position: true,
              avatar: true,
            },
          },
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              name: true,
              slug: true,
              logo: true,
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
      },
    },
  });

  invariantResponse(project !== null, locales.route.error.invariant.notFound, {
    status: 404,
  });

  let logo = project.logo;
  let blurredLogo;
  if (logo !== null) {
    const publicURL = getPublicURL(authClient, logo);
    if (publicURL) {
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Detail.ContactLogo },
      });
      blurredLogo = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Project.Detail.BlurredContactLogo,
        },
        blur: BlurFactor,
      });
    }
  }

  const teamMembers = project.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL) {
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
    return {
      ...relation,
      profile: { ...relation.profile, avatar, blurredAvatar },
    };
  });

  const responsibleOrganizations = project.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItemProjectDetailAndSettings
                .BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return {
        ...relation,
        organization: { ...relation.organization, logo, blurredLogo },
      };
    }
  );

  const enhancedProject = {
    ...project,
    logo,
    blurredLogo,
    teamMembers,
    responsibleOrganizations,
  };

  return { project: enhancedProject, locales };
};

function About() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const street = `${
    loaderData.project.street !== null ? loaderData.project.street : ""
  } ${
    loaderData.project.streetNumber !== null
      ? loaderData.project.streetNumber
      : ""
  } ${
    loaderData.project.streetNumberAddition !== null
      ? loaderData.project.streetNumberAddition
      : ""
  }`.trimEnd();
  const city = `${
    loaderData.project.zipCode !== null ? loaderData.project.zipCode : ""
  } ${
    loaderData.project.city !== null ? loaderData.project.city : ""
  }`.trimEnd();

  return (
    <>
      <h1 className="mv-text-primary @md:mv-font-bold @lg:mv-font-black mv-text-5xl @lg:mv-text-7xl mb-0">
        {loaderData.project.name}
      </h1>
      {loaderData.project.excerpt !== null && (
        <p className="mv-font-semibold mv-text-lg @lg:mv-text-2xl mv-text-neutral-700 mv-text-wrap">
          {loaderData.project.excerpt}
        </p>
      )}
      {loaderData.project.formats.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.formats}
          </h3>
          <Chip.Container>
            {loaderData.project.formats.map((relation) => {
              let title;
              if (relation.format.slug in locales.formats) {
                type LocaleKey = keyof typeof locales.formats;
                title =
                  locales.formats[relation.format.slug as LocaleKey].title;
              } else {
                console.error(
                  `Format ${relation.format.slug} not found in locales`
                );
                title = relation.format.slug;
              }
              return (
                <Chip key={relation.format.slug} color="primary">
                  {title}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.furtherFormats.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.furtherFormats}
          </h3>
          <Chip.Container>
            {loaderData.project.furtherFormats.map((furtherFormat) => {
              return (
                <Chip key={furtherFormat} color="primary">
                  {furtherFormat}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {(loaderData.project.disciplines.length > 0 ||
        loaderData.project.additionalDisciplines.length > 0) && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.disciplines}
          </h3>
          <Chip.Container>
            {loaderData.project.disciplines.length > 0 &&
              loaderData.project.disciplines.map((relation) => {
                let title;
                if (relation.discipline.slug in locales.disciplines) {
                  type LocaleKey = keyof typeof locales.disciplines;
                  title =
                    locales.disciplines[relation.discipline.slug as LocaleKey]
                      .title;
                } else {
                  console.error(
                    `Discipline ${relation.discipline.slug} not found in locales`
                  );
                  title = relation.discipline.slug;
                }
                return (
                  <Chip key={relation.discipline.slug} color="primary">
                    {title}
                  </Chip>
                );
              })}
            {loaderData.project.additionalDisciplines.length > 0 &&
              loaderData.project.additionalDisciplines.map((relation) => {
                let title;
                if (
                  relation.additionalDiscipline.slug in
                  locales.additionalDisciplines
                ) {
                  type LocaleKey = keyof typeof locales.additionalDisciplines;
                  title =
                    locales.additionalDisciplines[
                      relation.additionalDiscipline.slug as LocaleKey
                    ].title;
                } else {
                  console.error(
                    `Additional discipline ${relation.additionalDiscipline.slug} not found in locales`
                  );
                  title = relation.additionalDiscipline.slug;
                }
                return (
                  <Chip
                    key={relation.additionalDiscipline.slug}
                    color="primary"
                  >
                    {title}
                  </Chip>
                );
              })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.furtherDisciplines.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.furtherDisciplines}
          </h3>
          <div className="mv-flex mv-flex-wrap mv-gap-2">
            <ul className="mv-list-disc mv-list-inside mv-font-normal mv-text-neutral-800 mv-px-2">
              {loaderData.project.furtherDisciplines.map((format, index) => {
                return <li key={index}>{format}</li>;
              })}
            </ul>
          </div>
        </div>
      )}
      {loaderData.project.projectTargetGroups.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.projectTargetGroups}
          </h3>
          <Chip.Container>
            {loaderData.project.projectTargetGroups.map((relation) => {
              let title;
              if (
                relation.projectTargetGroup.slug in locales.projectTargetGroups
              ) {
                type LocaleKey = keyof typeof locales.projectTargetGroups;
                title =
                  locales.projectTargetGroups[
                    relation.projectTargetGroup.slug as LocaleKey
                  ].title;
              } else {
                console.error(
                  `Project target group ${relation.projectTargetGroup.slug} not found in locales`
                );
                title = relation.projectTargetGroup.slug;
              }
              return (
                <Chip key={relation.projectTargetGroup.slug} color="primary">
                  {title}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.specialTargetGroups.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.specialTargetGroups}
          </h3>
          <Chip.Container>
            {loaderData.project.specialTargetGroups.map((relation) => {
              let title;
              if (
                relation.specialTargetGroup.slug in locales.specialTargetGroups
              ) {
                type LocaleKey = keyof typeof locales.specialTargetGroups;
                title =
                  locales.specialTargetGroups[
                    relation.specialTargetGroup.slug as LocaleKey
                  ].title;
              } else {
                console.error(
                  `Focus ${relation.specialTargetGroup.slug} not found in locales`
                );
                title = relation.specialTargetGroup.slug;
              }
              return (
                <Chip key={relation.specialTargetGroup.slug} color="primary">
                  {title}
                </Chip>
              );
            })}
          </Chip.Container>
        </div>
      )}
      {loaderData.project.targetGroupAdditions !== null && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.targetGroupAdditions}
          </h3>
          <p className="mv-font-normal mv-text-neutral-800">
            {loaderData.project.targetGroupAdditions}
          </p>
        </div>
      )}
      {loaderData.project.participantLimit !== null && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.participantLimit}
          </h3>
          <p className="mv-font-normal mv-text-neutral-800">
            {loaderData.project.participantLimit}
          </p>
        </div>
      )}
      {loaderData.project.areas.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
            {locales.route.content.areas}
          </h3>
          <p className="mv-font-normal mv-text-neutral-800">
            {loaderData.project.areas
              .map((relation) => relation.area.name)
              .join(" / ")}
          </p>
        </div>
      )}
      {(loaderData.project.furtherDescription !== null ||
        loaderData.project.idea !== null ||
        loaderData.project.goals !== null ||
        loaderData.project.implementation !== null ||
        loaderData.project.targeting !== null ||
        loaderData.project.hints !== null) && (
        <>
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {locales.route.content.furtherDescription}
          </h2>
          {/* only further description */}
          {loaderData.project.furtherDescription !== null &&
            loaderData.project.idea === null &&
            loaderData.project.goals === null &&
            loaderData.project.implementation === null &&
            loaderData.project.targeting === null &&
            loaderData.project.hints === null && (
              <RichText html={loaderData.project.furtherDescription} />
            )}
          {loaderData.project.idea !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {locales.route.content.idea}
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.idea}
              />
            </div>
          )}
          {loaderData.project.goals !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {locales.route.content.goals}
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.goals}
              />
            </div>
          )}
          {loaderData.project.implementation !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {locales.route.content.implementation}
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.implementation}
              />
            </div>
          )}
          {loaderData.project.targeting !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {locales.route.content.targeting}
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.targeting}
              />
            </div>
          )}
          {loaderData.project.hints !== null && (
            <div className="mv-flex mv-flex-col mv-gap-4">
              <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                {locales.route.content.hints}
              </h3>
              <RichText
                additionalClassNames="mv-text-lg mv-mb-0"
                html={loaderData.project.hints}
              />
            </div>
          )}
          {/* not only further description */}
          {loaderData.project.furtherDescription !== null &&
            (loaderData.project.idea !== null ||
              loaderData.project.goals !== null ||
              loaderData.project.implementation !== null ||
              loaderData.project.targeting !== null ||
              loaderData.project.hints !== null) && (
              <div className="mv-flex mv-flex-col mv-gap-4">
                <h3 className="mv-text-neutral-700 mv-text-lg mv-font-bold mv-mb-0">
                  {locales.route.content.furtherDescription2}
                </h3>
                <RichText
                  additionalClassNames="mv-text-lg"
                  html={loaderData.project.furtherDescription}
                />
              </div>
            )}
        </>
      )}
      {loaderData.project.video !== null && (
        <Video src={loaderData.project.video} locales={locales}>
          {loaderData.project.videoSubline !== null && (
            <Video.Subline>{loaderData.project.videoSubline}</Video.Subline>
          )}
        </Video>
      )}
      {loaderData.project.teamMembers.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-2">
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {locales.route.content.team}
          </h2>
          <List maxColumns={2}>
            {loaderData.project.teamMembers.map((relation) => {
              return (
                <List.Item
                  key={relation.profile.username}
                  noBorder
                  interactive
                  as={{
                    type: "link",
                    props: { to: `/profile/${relation.profile.username}` },
                  }}
                >
                  <List.Item.Info>
                    <List.Item.Title>
                      {relation.profile.firstName} {relation.profile.lastName}
                    </List.Item.Title>
                    <List.Item.Subtitle>
                      {relation.profile.position}
                    </List.Item.Subtitle>
                  </List.Item.Info>

                  <Avatar
                    firstName={relation.profile.firstName}
                    lastName={relation.profile.lastName}
                    avatar={relation.profile.avatar}
                    blurredAvatar={relation.profile.blurredAvatar}
                  />
                </List.Item>
              );
            })}
          </List>
        </div>
      )}
      {loaderData.project.responsibleOrganizations.length > 0 && (
        <div className="mv-flex mv-flex-col mv-gap-2">
          <h2 className="mv-text-2xl @md:mv-text-5xl mv-font-bold mv-text-primary mv-mb-0">
            {locales.route.content.responsibleOrganizations}
          </h2>
          <List maxColumns={2}>
            {loaderData.project.responsibleOrganizations.map((relation) => {
              return (
                <List.Item
                  key={relation.organization.slug}
                  noBorder
                  interactive
                  as={{
                    type: "link",
                    props: {
                      to: `/organization/${relation.organization.slug}`,
                    },
                  }}
                >
                  <List.Item.Info>
                    <List.Item.Title>
                      {relation.organization.name}
                    </List.Item.Title>
                    <List.Item.Subtitle>
                      {relation.organization.types
                        .map((relation) => {
                          let title;
                          if (
                            relation.organizationType.slug in
                            locales.organizationTypes
                          ) {
                            type LocaleKey =
                              keyof typeof locales.organizationTypes;
                            title =
                              locales.organizationTypes[
                                relation.organizationType.slug as LocaleKey
                              ].title;
                          } else {
                            console.error(
                              `Organization type ${relation.organizationType.slug} not found in locales`
                            );
                            title = relation.organizationType.slug;
                          }
                          return title;
                        })
                        .join(", ")}
                    </List.Item.Subtitle>
                  </List.Item.Info>

                  <Avatar
                    name={relation.organization.name}
                    logo={relation.organization.logo}
                    blurredLogo={relation.organization.blurredLogo}
                  />
                </List.Item>
              );
            })}
          </List>
        </div>
      )}
      <div className="mv-flex mv-flex-col @md:mv-flex-row mv-gap-8 @md:mv-gap-4 mv-items-center mv-bg-primary-50 mv-p-4 @md:mv-p-8 mv-rounded-xl">
        <div className="mv-flex mv-flex-col mv-items-center mv-gap-4">
          <div className="mv-w-64 mv-aspect-[1]">
            <AvatarIcon
              logo={loaderData.project.logo}
              blurredLogo={loaderData.project.blurredLogo}
              name={loaderData.project.name}
            />
          </div>
          <h4 className="mv-text-neutral-700 mv-text-lg mv-text-center mv-font-bold mv-mb-0">
            {loaderData.project.name}
          </h4>
        </div>
        <div className="mv-w-full mv-flex mv-flex-col mv-gap-2">
          {loaderData.project.email !== null && (
            <div className="mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-flex mv-gap-4 mv-no-wrap">
              <Envelope />
              <a href={`mailto:${loaderData.project.email}`}>
                {loaderData.project.email}
              </a>
            </div>
          )}
          {loaderData.project.phone !== null && (
            <div className="mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-flex mv-gap-4 mv-no-wrap">
              <Phone />
              <a href={`tel:${loaderData.project.phone}`}>
                {loaderData.project.phone}
              </a>
            </div>
          )}
          {loaderData.project.website !== null && (
            <div className="mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-flex mv-gap-4 mv-no-wrap">
              <Globe />
              <a
                href={loaderData.project.website}
                target="__blank"
                rel="noopener noreferrer"
              >
                {loaderData.project.website}
              </a>
            </div>
          )}
          {(loaderData.project.contactName !== null ||
            loaderData.project.street !== null ||
            loaderData.project.streetNumber !== null ||
            loaderData.project.zipCode !== null ||
            loaderData.project.city !== null) && (
            <div className="mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-flex mv-gap-4 mv-no-wrap">
              <House />
              <address className="mv-flex mv-flex-col mv-not-italic">
                {loaderData.project.contactName !== null && (
                  <span>{loaderData.project.contactName}</span>
                )}
                {street !== "" && <span>{street}</span>}
                {city !== "" && <span>{city}</span>}
              </address>
            </div>
          )}
          {(loaderData.project.facebook !== null ||
            loaderData.project.linkedin !== null ||
            loaderData.project.twitter !== null ||
            loaderData.project.youtube !== null ||
            loaderData.project.instagram !== null ||
            loaderData.project.xing !== null ||
            loaderData.project.mastodon !== null ||
            loaderData.project.tiktok !== null) && (
            <div className="mv-flex mv-flex-row mv-flex-wrap mv-gap-2">
              {loaderData.project.facebook !== null && (
                <a
                  href={loaderData.project.facebook}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <Facebook />
                </a>
              )}
              {loaderData.project.linkedin !== null && (
                <a
                  href={loaderData.project.linkedin}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <LinkedIn />
                </a>
              )}
              {loaderData.project.twitter !== null && (
                <a
                  href={loaderData.project.twitter}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <Twitter />
                </a>
              )}
              {loaderData.project.youtube !== null && (
                <a
                  href={loaderData.project.youtube}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <YouTube />
                </a>
              )}
              {loaderData.project.instagram !== null && (
                <a
                  href={loaderData.project.instagram}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <Instagram />
                </a>
              )}
              {loaderData.project.xing !== null && (
                <a
                  href={loaderData.project.xing}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <Xing />
                </a>
              )}
              {loaderData.project.mastodon !== null && (
                <a
                  href={loaderData.project.mastodon}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <Mastodon />
                </a>
              )}
              {loaderData.project.tiktok !== null && (
                <a
                  href={loaderData.project.tiktok}
                  target="__blank"
                  rel="noopener noreferrer"
                  className="mv-flex-1 mv-flex mv-items-center mv-justify-center mv-px-4 mv-py-3 mv-bg-white mv-rounded-lg mv-text-neutral-700"
                >
                  <TikTok />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default About;
