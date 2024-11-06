import {
  Button,
  CardContainer,
  ProjectCard,
  TabBar,
} from "@mint-vernetzt/components";
import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { AddIcon, Container, Placeholder } from "./__components";
import { Section, TabBarTitle } from "./__events.components";
import { getProjects } from "./projects.server";

export const i18nNS = ["routes/my/projects"];

export const handle = {
  i18n: i18nNS,
};

export async function loader(args: LoaderFunctionArgs) {
  const { request } = args;
  const { authClient } = createAuthClient(request);

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
        <Button as="a" href="/project/create">
          <AddIcon />
          {t("create")}
        </Button>
      </Container.Header>
      {hasProjects === false ? (
        <Placeholder>
          <Placeholder.Title>{t("placeholder.title")}</Placeholder.Title>
          <Placeholder.Text>{t("placeholder.description")}</Placeholder.Text>
          <Button as="a" href="/project/create" variant="outline">
            {t("placeholder.cta")}
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
