import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { ProjectCard } from "@mint-vernetzt/components/src/organisms/cards/ProjectCard";
import { TabBar } from "@mint-vernetzt/components/src/organisms/TabBar";
import {
  type ActionFunctionArgs,
  Form,
  type LoaderFunctionArgs,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";
import { Link, useLoaderData, useSearchParams } from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { Add } from "~/components-next/icons/Add";
import { Container } from "~/components-next/MyProjectsCreateOrganizationContainer";
import { Placeholder } from "~/components-next/Placeholder";
import { Section } from "~/components-next/MyEventsProjectsSection";
import { TabBarTitle } from "~/components-next/TabBarTitle";
import { getProjects, quitProject } from "./projects.server";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { redirectWithToast } from "~/toast.server";
import { z } from "zod";
import { getFormProps, useForm } from "@conform-to/react-v1";
import { Modal } from "~/components-next/Modal";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { useEffect, useState } from "react";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { OverlayMenu } from "~/components-next/OverlayMenu";

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

  const currentTimestamp = Date.now();

  return { projects, locales, currentTimestamp };
}

export const quitProjectSchema = z.object({
  projectId: z.string(),
});

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["my/projects"];

  const { authClient } = createAuthClient(request);

  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);
  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  let result;
  let redirectUrl = request.url;
  const formData = await request.formData();
  const intent = formData.get("intent");
  invariantResponse(typeof intent === "string", "Intent is not a string.", {
    status: 400,
  });

  if (intent.startsWith("quit-adminProjects-")) {
    const quitProjectFormData = new FormData();
    const projectId = intent.replace("quit-adminProjects-", "");
    quitProjectFormData.set("projectId", projectId);
    result = await quitProject({
      formData: quitProjectFormData,
      locales,
      sessionUser,
      role: "admin",
    });
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    if (searchParams.get(`modal-quit-adminProjects-${projectId}`) === "true") {
      searchParams.delete(`modal-quit-adminProjects-${projectId}`);
    }
    redirectUrl = `${process.env.COMMUNITY_BASE_URL}${
      url.pathname
    }?${searchParams.toString()}`;
  } else if (intent.startsWith("quit-teamMemberProjects-")) {
    const quitProjectFormData = new FormData();
    const projectId = intent.replace("quit-teamMemberProjects-", "");
    quitProjectFormData.set("projectId", projectId);
    result = await quitProject({
      formData: quitProjectFormData,
      locales,
      sessionUser,
      role: "teamMember",
    });
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    if (
      searchParams.get(`modal-quit-teamMemberProjects-${projectId}`) === "true"
    ) {
      searchParams.delete(`modal-quit-teamMemberProjects-${projectId}`);
    }
    redirectUrl = `${process.env.COMMUNITY_BASE_URL}${
      url.pathname
    }?${searchParams.toString()}`;
  } else {
    invariantResponse(false, "Invalid intent", {
      status: 400,
    });
  }

  if (
    result.submission !== undefined &&
    result.submission.status === "success" &&
    result.toast !== undefined
  ) {
    return redirectWithToast(redirectUrl, result.toast);
  }
  return { submission: result.submission, currentTimestamp: Date.now() };
};

function MyProjects() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = useIsSubmitting();

  const firstProject = Object.entries(loaderData.projects.count).find(
    ([, value]) => {
      return value > 0;
    }
  ) || ["admin", 0];
  const [projects, setProjects] = useState(firstProject[0]);

  const [searchParams, setSearchParams] = useSearchParams({
    projects: firstProject[0],
  });

  useEffect(() => {
    if (searchParams.has("projects")) {
      const newValue = searchParams.get("projects") as string;
      if (newValue !== projects) {
        setProjects(newValue);
      }
    }
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("projects", projects);
    setSearchParams(params, { preventScrollReset: true, replace: true });
    // This eslint error is intentional to make the tab changes work
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const hasProjects = Object.values(loaderData.projects.count).some((value) => {
    return value > 0;
  });

  const [quitProjectForm] = useForm({
    id: `quit-organization-${actionData?.currentTimestamp || currentTimestamp}`,
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });

  return (
    <Container>
      <Container.Header>
        <Container.Title>{locales.route.title}</Container.Title>
        <Button as="link" to="/project/create" prefetch="intent">
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
          <Button
            as="link"
            to="/project/create"
            variant="outline"
            prefetch="intent"
          >
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
          <div className="mt-2 -mx-4 -mb-8">
            <Form
              {...getFormProps(quitProjectForm)}
              method="post"
              preventScrollReset
            >
              <CardContainer key={`projects`} type="multi row">
                {loaderData.projects[
                  projects as "adminProjects" | "teamMemberProjects"
                ].map((project) => {
                  const doubleCheckModalSearchParams = new URLSearchParams(
                    searchParams
                  );
                  doubleCheckModalSearchParams.set(
                    `modal-quit-${projects}-${project.id}`,
                    "true"
                  );
                  doubleCheckModalSearchParams.delete(
                    `overlay-menu-${projects}-${project.id}`
                  );
                  return (
                    <ProjectCard
                      key={project.slug}
                      project={project}
                      locales={locales}
                      prefetch="intent"
                    >
                      <ProjectCard.Controls>
                        <OverlayMenu
                          searchParam={`overlay-menu-${projects}-${project.id}`}
                        >
                          {projects === "adminProjects" ? (
                            <OverlayMenu.ListItem
                              key={`edit-project-${project.slug}`}
                            >
                              <Link
                                {...OverlayMenu.getListChildrenStyles()}
                                {...OverlayMenu.getIdToFocusWhenOpening()}
                                to={`/project/${project.slug}/settings/general`}
                                prefetch="intent"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M15.1831 0.183058C15.4272 -0.0610194 15.8229 -0.0610194 16.067 0.183058L19.817 3.93306C20.061 4.17714 20.061 4.57286 19.817 4.81694L7.31696 17.3169C7.25711 17.3768 7.18573 17.4239 7.10714 17.4553L0.857137 19.9553C0.625002 20.0482 0.359866 19.9937 0.183076 19.8169C0.00628736 19.6402 -0.0481339 19.375 0.0447203 19.1429L2.54472 12.8929C2.57616 12.8143 2.62323 12.7429 2.68308 12.6831L15.1831 0.183058ZM14.0089 3.125L16.875 5.99112L18.4911 4.375L15.625 1.50888L14.0089 3.125ZM15.9911 6.875L13.125 4.00888L5.00002 12.1339V12.5H5.62502C5.9702 12.5 6.25002 12.7798 6.25002 13.125V13.75H6.87502C7.2202 13.75 7.50002 14.0298 7.50002 14.375V15H7.86613L15.9911 6.875ZM3.78958 13.3443L3.65767 13.4762L1.74693 18.2531L6.52379 16.3423L6.6557 16.2104C6.41871 16.1216 6.25002 15.893 6.25002 15.625V15H5.62502C5.27984 15 5.00002 14.7202 5.00002 14.375V13.75H4.37502C4.10701 13.75 3.87841 13.5813 3.78958 13.3443Z"
                                    fill="CurrentColor"
                                  />
                                </svg>
                                <span>{locales.projectCard.edit}</span>
                              </Link>
                            </OverlayMenu.ListItem>
                          ) : null}
                          {projects === "adminProjects" ? (
                            <OverlayMenu.Divider key="edit-quit-divider" />
                          ) : null}
                          <OverlayMenu.ListItem
                            key={`quit-project-${project.slug}`}
                          >
                            <Link
                              {...OverlayMenu.getListChildrenStyles()}
                              to={`?${doubleCheckModalSearchParams.toString()}`}
                              preventScrollReset
                              prefetch="intent"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10.625 12.5C10.2798 12.5 10 11.9404 10 11.25C10 10.5596 10.2798 10 10.625 10C10.9702 10 11.25 10.5596 11.25 11.25C11.25 11.9404 10.9702 12.5 10.625 12.5Z"
                                  fill="CurrentColor"
                                />
                                <path
                                  d="M13.5345 0.152845C13.6714 0.271556 13.75 0.443822 13.75 0.625004V1.25H14.375C15.4105 1.25 16.25 2.08947 16.25 3.125V18.75H18.125C18.4702 18.75 18.75 19.0298 18.75 19.375C18.75 19.7202 18.4702 20 18.125 20H1.875C1.52982 20 1.25 19.7202 1.25 19.375C1.25 19.0298 1.52982 18.75 1.875 18.75H3.75V1.875C3.75 1.56397 3.97871 1.30027 4.28661 1.25629L13.0366 0.00628568C13.216 -0.0193374 13.3976 0.0341345 13.5345 0.152845ZM14.375 2.5H13.75V18.75H15V3.125C15 2.77983 14.7202 2.5 14.375 2.5ZM5 2.41706V18.75H12.5V1.34564L5 2.41706Z"
                                  fill="CurrentColor"
                                />
                              </svg>

                              <span>{locales.projectCard.quit}</span>
                            </Link>
                          </OverlayMenu.ListItem>
                        </OverlayMenu>
                        <Modal
                          searchParam={`modal-quit-${projects}-${project.id}`}
                        >
                          <Modal.Title>
                            {
                              locales.route.quit.modal[
                                projects as
                                  | "adminProjects"
                                  | "teamMemberProjects"
                              ].headline
                            }
                          </Modal.Title>
                          <Modal.Section>
                            {insertParametersIntoLocale(
                              locales.route.quit.modal[
                                projects as
                                  | "adminProjects"
                                  | "teamMemberProjects"
                              ].subline,
                              {
                                name: project.name,
                              }
                            )}
                          </Modal.Section>
                          <Modal.Section>
                            {typeof quitProjectForm.errors !== "undefined" &&
                            quitProjectForm.errors.length > 0 ? (
                              <div>
                                {quitProjectForm.errors.map((error, index) => {
                                  return (
                                    <div
                                      id={quitProjectForm.errorId}
                                      key={index}
                                      className="text-sm font-semibold text-negative-600"
                                    >
                                      {error}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </Modal.Section>
                          <Modal.SubmitButton
                            form={quitProjectForm.id}
                            type="submit"
                            name="intent"
                            value={`quit-${projects}-${project.id}`}
                            disabled={isSubmitting}
                          >
                            {
                              locales.route.quit.modal[
                                projects as
                                  | "adminProjects"
                                  | "teamMemberProjects"
                              ].cta
                            }
                          </Modal.SubmitButton>
                          <Modal.CloseButton>
                            {locales.route.quit.modal.cancelCta}
                          </Modal.CloseButton>
                        </Modal>
                      </ProjectCard.Controls>
                    </ProjectCard>
                  );
                })}
              </CardContainer>
            </Form>
          </div>
        </Section>
      )}
    </Container>
  );
}

export default MyProjects;
