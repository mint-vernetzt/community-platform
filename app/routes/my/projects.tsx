import { useTranslation } from "react-i18next";
import { AddIcon, Container, Placeholder, Button } from "./__components";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { Section, TabBarTitle } from "./__events.components";
import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { getProjects } from "./projects.server";
import { CardContainer, ProjectCard, TabBar } from "@mint-vernetzt/components";
import React from "react";

export const i18nNS = ["routes/my/projects"];

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["my_projects"]);

  if (abilities.my_projects.hasAccess === false) {
    return redirect("/");
  }

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const projects = await getProjects({ profileId: sessionUser.id, authClient });

  return json({ projects });
}

function MyProjects() {
  const { t } = useTranslation(i18nNS);

  const loaderData = useLoaderData<typeof loader>();

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
  }, [searchParams]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("projects", projects);
    setSearchParams(params, { preventScrollReset: true, replace: true });
  }, [projects]);

  const hasProjects = Object.values(loaderData.projects.count).some((value) => {
    return value > 0;
  });

  return (
    <Container>
      <Container.Header>
        <Container.Title>{t("title")}</Container.Title>
        <Button>
          <Link to="/project/create">
            <AddIcon />
            {t("create")}
          </Link>
        </Button>
      </Container.Header>
      {hasProjects === false ? (
        <Placeholder>
          <Placeholder.Title>{t("placeholder.title")}</Placeholder.Title>
          <Placeholder.Text>{t("placeholder.description")}</Placeholder.Text>
          <Button variant="secondary">
            <Link to="/project/create">{t("placeholder.cta")}</Link>
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
                      {t(`tabBar.${key}`)}
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
