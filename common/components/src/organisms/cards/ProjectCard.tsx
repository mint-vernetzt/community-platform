import { removeHtmlTags } from "../../../../../app/lib/utils/sanitizeUserHtml";
import Avatar from "../../molecules/Avatar";
import { Card } from "./Card";

export type ProjectCardProps = {
  project: {
    name: string;
    slug: string;
    excerpt?: string | null;
    background?: string | null;
    logo?: string | null;
    responsibleOrganizations: {
      organization: {
        name: string;
        slug: string;
        logo?: string | null;
      };
    }[];
  };
};

function ProjectCard(props: ProjectCardProps) {
  const { project } = props;
  return (
    <Card to={`/project/${project.slug}`}>
      <Card.Header cardType="project">
        <Avatar {...project} size="xl" />
        {project.background && <Card.Image src={project.background} />}
      </Card.Header>
      <Card.Body>
        <div className="mv-mt-[30px] mv-max-h-10 mv-overflow-hidden">
          <h4 className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-line-clamp-2">
            {project.name}
          </h4>
        </div>
        <div className="mv-h-14">
          {typeof project.excerpt !== "undefined" &&
            project.excerpt !== null && (
              <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-line-clamp-3">
                {removeHtmlTags(project.excerpt)}
              </p>
            )}
        </div>
      </Card.Body>
      <Card.Footer>
        <Avatar.List visibleAvatars={1}>
          {project.responsibleOrganizations.map((item) => {
            const { organization } = item;
            return (
              <Avatar
                key={organization.slug}
                {...organization}
                size="sm"
                to={`/organization/${organization.slug}`}
              />
            );
          })}
        </Avatar.List>
      </Card.Footer>
    </Card>
  );
}

export default ProjectCard;
