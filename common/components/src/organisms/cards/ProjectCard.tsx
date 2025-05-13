import { type DashboardLocales } from "~/routes/dashboard.server";
import { type ExploreProjectsLocales } from "~/routes/explore/projects.server";
import { type MyProjectsLocales } from "~/routes/my/projects.server";
import { type SearchProjectsLocales } from "~/routes/search/projects.server";
import { Avatar } from "./../../molecules/Avatar";
import { Image } from "./../../molecules/Image";
import { Card } from "./Card";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ProjectCardContext = createContext<ProjectCardProps | null>(null);

function useProjectCard() {
  const context = useContext(ProjectCardContext);
  if (context === null) {
    throw new Error("Missing ProjectCardContext.Provider");
  }
  return context;
}

function ContextMenu(props: React.PropsWithChildren) {
  const { children } = props;
  const childrenArray = Children.toArray(children);
  const listItems = childrenArray.filter(
    (child) =>
      isValidElement(child) &&
      (child.type === ContextMenuListItem || child.type === ContextMenuDivider)
  );
  const { project, locales } = useProjectCard();
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    setChecked(!checked);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        inputRef.current !== null &&
        inputRef.current.contains(target) === false &&
        typeof listRef !== "undefined" &&
        listRef.current !== null &&
        listRef.current.contains(target) === false
      ) {
        setChecked(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="mv-absolute mv-top-2 mv-right-2">
      <label
        htmlFor={`project-context-menu-${project.slug}`}
        className="mv-p-2 mv-w-8 mv-h-8 mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-rounded-lg mv-border mv-border-primary mv-bg-neutral-50 mv-cursor-pointer"
        aria-description={`project context menu for ${project.name}`}
        aria-label={locales.projectCard.contextMenu}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 9.5C2.17157 9.5 1.5 8.82843 1.5 8C1.5 7.17157 2.17157 6.5 3 6.5C3.82843 6.5 4.5 7.17157 4.5 8C4.5 8.82843 3.82843 9.5 3 9.5ZM8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8C9.5 8.82843 8.82843 9.5 8 9.5ZM13 9.5C12.1716 9.5 11.5 8.82843 11.5 8C11.5 7.17157 12.1716 6.5 13 6.5C13.8284 6.5 14.5 7.17157 14.5 8C14.5 8.82843 13.8284 9.5 13 9.5Z"
            fill="black"
          />
        </svg>
      </label>
      <input
        ref={inputRef}
        type="checkbox"
        id={`project-context-menu-${project.slug}`}
        className="mv-w-0 mv-h-0 mv-appearance-none mv-opacity-0 mv-peer mv-absolute"
        onChange={handleChange}
        checked={checked}
      />
      <ul
        ref={listRef}
        className="mv-absolute mv-right-0 mv-top-0 mv-bg-white mv-rounded-lg mv-p-2 mv-hidden peer-[:checked]:mv-flex mv-flex-col mv-gap-4 mv-text-neutral-700 mv-leading-[19px] mv-text-nowrap"
      >
        {listItems}
      </ul>
    </div>
  );
}

function ContextMenuListItem(
  props: React.PropsWithChildren & React.HTMLProps<HTMLLIElement>
) {
  const { children, ...rest } = props;
  return (
    <li
      {...rest}
      className="mv-rounded-lg hover:mv-bg-primary-50 focus:mv-bg-primary-50 active:mv-bg-primary-100"
    >
      {children}
    </li>
  );
}

function ContextMenuDivider() {
  return (
    <div
      key="divider"
      className="mv-w-full mv-h-0 mv-border-b mv-border-neutral-200"
    />
  );
}

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
  locales:
    | DashboardLocales
    | ExploreProjectsLocales
    | MyProjectsLocales
    | SearchProjectsLocales;
};

function ProjectCard(
  props: ProjectCardProps & {
    children?: React.ReactNode;
  }
) {
  const { project, locales, children } = props;

  const childrenArray =
    props.children !== undefined ? Children.toArray(children) : [];
  const menu = childrenArray.filter(
    (child) => isValidElement(child) && child.type === ContextMenu
  );

  return (
    <ProjectCardContext.Provider value={props}>
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
              <h4 className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0 mv-line-clamp-2">
                {project.name}
              </h4>
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
            <Avatar.List visibleAvatars={2}>
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
        {menu.length > 0 ? menu : null}
      </div>
    </ProjectCardContext.Provider>
  );
}

ContextMenu.ListItem = ContextMenuListItem;
ContextMenu.Divider = ContextMenuDivider;
ProjectCard.ContextMenu = ContextMenu;

export { ProjectCard };
