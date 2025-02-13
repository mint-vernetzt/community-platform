import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import React from "react";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { Add } from "~/components-next/icons/Add";
import { Container } from "~/components-next/MyProjectsCreateOrganizationContainer";
import { Placeholder } from "~/components-next/Placeholder";
import { Section } from "~/components-next/MyEventsProjectsSection";
import { TabBarTitle } from "~/components-next/TabBarTitle";
import { getProjects } from "./projects.server";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/i18n.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/projects"];

  const projects = await getProjects({ profileId: sessionUser.id, authClient });

  return { projects, locales };
}

function MyProjects() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  const firstProject = Object.entries(loaderData.projects.count).find(
    ([, value]) => {
      return value > 0;
    }
  ) || ["admin", 0];
  const [projects, setProjects] = React.useState(firstProject[0]);

  const [searchParams, setSearchParams] = useSearchParams({
    projects: firstProject[0],
  });

  React.useEffect(() => {
    if (searchParams.has("projects")) {
      const newValue = searchParams.get("projects") as string;
      if (newValue !== projects) {
        setProjects(newValue);
      }
    }
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("projects", projects);
    setSearchParams(params, { preventScrollReset: true, replace: true });
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const hasProjects = Object.values(loaderData.projects.count).some((value) => {
    return value > 0;
  });

  return (
    <Container>
      <Container.Header>
        <Container.Title>{locales.route.title}</Container.Title>
        <Button as="a" href="/project/create">
          <Add />
          {locales.route.create}
        </Button>
      </Container.Header>
      {hasProjects === false ? (
        <Placeholder>
          <Placeholder.Title>
            {locales.route.placeholder.title}
          </Placeholder.Title>
          <Placeholder.Text>
            {locales.route.placeholder.description}
          </Placeholder.Text>
          <Button as="a" href="/project/create" variant="outline">
            {locales.route.placeholder.cta}
          </Button>
        </Placeholder>
      ) : (
        <Section>
          <Section.TabBar>
            {Object.entries(loaderData.projects.count).map(([key, value]) => {
              if (value === 0) {
                return null;
              }
              const typedKey = key as keyof typeof loaderData.projects.count;

              const searchParamsCopy = new URLSearchParams(searchParams);
              searchParamsCopy.set("projects", key);

              return (
                <TabBar.Item key={`projects-${key}`} active={projects === key}>
                  <Link
                    to={`?${searchParamsCopy.toString()}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setProjects(key);
                    }}
                    preventScrollReset
                  >
                    <TabBarTitle>
                      {(() => {
                        let title;
                        if (key in locales.route.tabBar) {
                          type LocaleKey = keyof typeof locales.route.tabBar;
                          title = locales.route.tabBar[key as LocaleKey];
                        } else {
                          console.error(
                            `Tab bar title ${key} not found in locales`
                          );
                          title = key;
                        }
                        return title;
                      })()}
                      <TabBar.Counter active={projects === key}>
                        {loaderData.projects.count[typedKey]}
                      </TabBar.Counter>
                    </TabBarTitle>
                  </Link>
                </TabBar.Item>
              );
            })}
          </Section.TabBar>
          <div className="mv-mt-2 mv--mx-4 mv--mb-8">
            <CardContainer key={`projects`} type="multi row">
              {loaderData.projects[projects as "adminProjects"].map(
                (project) => {
                  return (
                    <ProjectCard
                      key={project.slug}
                      project={project}
                      mode={
                        projects === "adminProjects" ? "admin" : "teamMember"
                      }
                      locales={locales}
                    />
                  );
                }
              )}
            </CardContainer>
          </div>
        </Section>
      )}
    </Container>
  );
}

export default MyProjects;
