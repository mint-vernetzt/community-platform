import { Children, isValidElement } from "react";
import { Heading } from "~/components/legacy/Heading/Heading";
import { type DashboardLocales } from "~/routes/dashboard.server";
import { type ExploreProjectsLocales } from "~/routes/explore/projects.server";
import { type MyProjectsLocales } from "~/routes/my/projects.server";
import { Avatar } from "./../../molecules/Avatar";
import { Image } from "./../../molecules/Image";
import { Card, CardControls } from "./Card";
import { type LinkProps } from "react-router";

type ProjectCardProps = {
  project: {
    name: string;
    slug: string;
    excerpt?: string | null;
    subline?: string | null;
    background?: string | null;
    blurredBackground?: string;
    logo?: string | null;
    blurredLogo?: string;
    published?: boolean;
    responsibleOrganizations: {
      organization: {
        name: string;
        slug: string;
        logo?: string | null;
      };
    }[];
  };
  locales: DashboardLocales | ExploreProjectsLocales | MyProjectsLocales;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  prefetch?: LinkProps["prefetch"];
};

function ProjectCard(
  props: ProjectCardProps & {
    children?: React.ReactNode;
  }
) {
  const { project, locales, as = "h4", prefetch } = props;

  const children = Children.toArray(props.children);

  const controls = children.find((child) => {
    return isValidElement(child) && child.type === CardControls;
  });

  return (
    <div className="relative w-full h-full">
      <Card to={`/project/${project.slug}/detail/about`} prefetch={prefetch}>
        <Card.Header cardType="project">
          {typeof project.published !== "undefined" &&
            project.published === false && (
              <Card.Status variant="primary" inverted>
                {locales.projectCard.draft}
              </Card.Status>
            )}
          <Avatar {...project} size="xl" />
          {project.background && (
            <Image
              alt={project.name}
              src={project.background}
              blurredSrc={project.blurredBackground}
            />
          )}
        </Card.Header>
        <Card.Body>
          <div className="mt-[30px] max-h-10 overflow-hidden">
            <Heading
              as={as}
              className="text-primary text-base leading-5 font-bold mb-0 line-clamp-2"
            >
              {project.name}
            </Heading>
          </div>
          <div className="h-14">
            {((typeof project.subline !== "undefined" &&
              project.subline !== null) ||
              (typeof project.excerpt !== "undefined" &&
                project.excerpt !== null)) && (
              <p className="text-neutral-700 text-sm leading-5 line-clamp-3">
                {project.subline || project.excerpt}
              </p>
            )}
          </div>
        </Card.Body>
        <Card.Footer>
          <Avatar.List
            visibleAvatars={2}
            moreIndicatorProps={{
              to: `/project/${project.slug}/detail/about#responsible-organizations`,
              prefetch: prefetch,
            }}
          >
            {project.responsibleOrganizations.map((item) => {
              const { organization } = item;
              return (
                <Avatar
                  key={organization.slug}
                  {...organization}
                  size="sm"
                  to={`/organization/${organization.slug}/detail/about`}
                  prefetch={prefetch}
                />
              );
            })}
          </Avatar.List>
        </Card.Footer>
      </Card>
      {typeof controls !== "undefined" ? controls : null}
    </div>
  );
}

ProjectCard.Controls = CardControls;

export { ProjectCard };
