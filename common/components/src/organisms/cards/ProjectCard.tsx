import { Children, isValidElement } from "react";
import { Heading } from "~/components/Heading/Heading";
import { type DashboardLocales } from "~/routes/dashboard.server";
import { type ExploreProjectsLocales } from "~/routes/explore/projects.server";
import { type MyProjectsLocales } from "~/routes/my/projects.server";
import { Avatar } from "./../../molecules/Avatar";
import { Image } from "./../../molecules/Image";
import { Card, CardControls } from "./Card";

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
};

function ProjectCard(
  props: ProjectCardProps & {
    children?: React.ReactNode;
  }
) {
  const { project, locales, as = "h4" } = props;

  const children = Children.toArray(props.children);

  const controls = children.find((child) => {
    return isValidElement(child) && child.type === CardControls;
  });

  return (
    <div className="mv-relative mv-w-full mv-h-full">
      <Card to={`/project/${project.slug}`}>
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
          <div className="mv-mt-[30px] mv-max-h-10 mv-overflow-hidden">
            <Heading
              as={as}
              className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-line-clamp-2"
            >
              {project.name}
            </Heading>
          </div>
          <div className="mv-h-14">
            {((typeof project.subline !== "undefined" &&
              project.subline !== null) ||
              (typeof project.excerpt !== "undefined" &&
                project.excerpt !== null)) && (
              <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-line-clamp-3">
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
