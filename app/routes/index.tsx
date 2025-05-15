import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CircleButton } from "@mint-vernetzt/components/src/molecules/CircleButton";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Roadmap } from "@mint-vernetzt/components/src/organisms/Roadmap";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Accordion } from "~/components-next/Accordion";
import { CountUp } from "~/components-next/CountUp";
import { HidePassword } from "~/components-next/icons/HidePassword";
import { ShowPassword } from "~/components-next/icons/ShowPassword";
import { H1, H3 } from "~/components/Heading/Heading";
import { RichText } from "~/components/Richtext/RichText";
import { detectLanguage } from "~/i18n.server";
import { insertComponentsIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";
import { createLoginSchema } from "./login";
import { login } from "./login/index.server";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "./utils.server";
import { useState } from "react";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);

  if (sessionUser !== null) {
    // Default redirect on logged in user
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["index"];

  const profileCount = await getProfileCount();
  const organizationCount = await getOrganizationCount();
  const eventCount = await getEventCount();
  const projectCount = await getProjectCount();

  return {
    profileCount,
    organizationCount,
    eventCount,
    projectCount,
    locales,
    currentTimestamp: Date.now(),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["index"];
  const { authClient } = createAuthClient(request);

  // Conform
  const formData = await request.formData();
  const { submission } = await login({
    formData,
    request,
    authClient,
    locales: locales.route,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimestamp: Date.now(),
    };
  }

  if (typeof submission.value.loginRedirect !== "undefined") {
    return redirect(submission.value.loginRedirect, {
      headers: submission.value.headers,
    });
  } else {
    return redirect("/dashboard", {
      headers: submission.value.headers,
    });
  }
};

export default function Index() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const { locales, currentTimestamp } = loaderData;
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();
  const loginRedirect = urlSearchParams.get("login_redirect");
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, loginFields] = useForm({
    id: `login-${actionData?.currentTimestamp || currentTimestamp}`,
    constraint: getZodConstraint(createLoginSchema(locales.route)),
    defaultValue: {
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onInput",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createLoginSchema(locales.route),
      });
      return submission;
    },
  });

  return (
    <>
      <section className="mv-bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)]">
        <div className="mv-py-16 @lg:mv-py-20 mv-relative mv-overflow-hidden mv-min-h-[calc(100dvh-76px)] lg:mv-min-h-[calc(100dvh-80px)] @md:mv-flex @md:mv-items-center">
          <div className="mv-absolute mv-top-[50%] mv-left-0 -mv-ml-[250px] mv-mt-[200px] mv-hidden @lg:mv-block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="579"
              height="544"
              fill="none"
            >
              <path
                fill="#FFCF53"
                d="M291.146 532.638S105.447 474.955 40.529 432.061C-24.39 389.168-1.023 154 40.528 54.714 72.893-22.624 225.11-4.286 393.83 32.2c197.157 42.635 202.564 117.989 167.847 345.815C533.904 560.277 393.83 555 291.146 532.638Z"
              />
            </svg>
          </div>

          <div className="mv-absolute mv-top-[-80px] mv-left-1/2 mv-ml-[400px] mv-hidden @lg:mv-block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="945"
              height="947"
              fill="none"
            >
              <path
                fill="#FFCF53"
                d="M508.34 945.443c-89.582 9.463-180.276-67.216-195.857-76.352-15.581-9.136-180.122-118.666-263.692-206.297-104.462-109.538-28.635-229.26 123.96-490.517 152.596-261.258 257.514-203.28 580.525 27.841 338.964 242.537 139.878 409.42 56.878 514.42-83 105-212.232 221.442-301.814 230.905Z"
              />
            </svg>
          </div>

          <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative">
            <div className="@md:mv-grid @md:mv-grid-cols-12 @md:mv-gap-6 @lg:mv-gap-8">
              <div className="@md:mv-col-start-1 @md:mv-col-span-7 @xl:mv-col-start-2 @xl:mv-col-span-5 @md:mv-flex @md:mv-items-center">
                <div>
                  <H1 className="mv-text-center @sm:mv-text-left mv-text-primary-600 mv-text-7xl mv-font-black mv-leading-[52px]">
                    {locales.route.welcome}
                  </H1>
                  <p className="mv-mt-8 mv-mb-8 @lg:mv-mb-0 mv-text-primary-600 mv-font-semibold mv-leading-5">
                    {locales.route.intro}
                  </p>
                </div>
              </div>

              <div className="@md:mv-col-start-8 @md:mv-col-span-5 @lg:mv-col-start-9 @lg:mv-col-span-4 @xl:mv-col-start-8 @xl:mv-col-span-4">
                <div className="mv-py-8 mv-bg-transparent @sm:mv-bg-neutral-50 @sm:mv-rounded-3xl @sm:mv-p-8 @sm:mv-shadow-[4px_5px_26px_-8px_rgba(177,111,171,0.95)]">
                  <div className="mv-text-center">
                    <Button
                      as="a"
                      size="large"
                      href={`/auth/keycloak${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      variant="outline"
                      fullSize
                      name={locales.route.login.withMintId}
                    >
                      {locales.route.login.withMintId}
                    </Button>
                    <a
                      href="https://mint-id.org/faq"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mv-block mv-py-2 mv-text-primary mv-font-semibold mv-underline"
                    >
                      {locales.route.login.moreInformation}
                    </a>
                    <div className="mv-mt-4 mv-mb-8">
                      <hr className="mv-mx-5" />
                      <span className="mv-block -mv-my-3 mv-mx-auto mv-w-fit mv-px-4 mv-text-primary mv-bg-white @sm:mv-mv-bg-neutral-50 mv-font-bold">
                        {locales.route.login.or}
                      </span>
                    </div>
                  </div>
                  <Form
                    {...getFormProps(loginForm)}
                    method="post"
                    preventScrollReset
                    autoComplete="off"
                  >
                    {typeof loginForm.errors !== "undefined" &&
                    loginForm.errors.length > 0 ? (
                      <div>
                        {loginForm.errors.map((error, index) => {
                          return (
                            <div
                              key={index}
                              className="mv-p-3 mv-mb-3 mv-bg-negative-100 mv-text-negative-900 mv-rounded-md"
                            >
                              <RichText id={loginForm.errorId} html={error} />
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="mv-mb-4">
                      <Input
                        {...getInputProps(loginFields.email, { type: "text" })}
                        key="email"
                      >
                        <Input.Label htmlFor={loginFields.email.id}>
                          {locales.route.form.label.email}
                        </Input.Label>
                        {typeof loginFields.email.errors !== "undefined" &&
                        loginFields.email.errors.length > 0
                          ? loginFields.email.errors.map((error) => (
                              <Input.Error
                                id={loginFields.email.errorId}
                                key={error}
                              >
                                {error}
                              </Input.Error>
                            ))
                          : null}
                      </Input>
                    </div>
                    <Input
                      {...getInputProps(loginFields.password, {
                        type: showPassword ? "text" : "password",
                      })}
                      key="password"
                    >
                      <Input.Label htmlFor={loginFields.password.id}>
                        {locales.route.form.label.password}
                      </Input.Label>
                      {typeof loginFields.password.errors !== "undefined" &&
                      loginFields.password.errors.length > 0
                        ? loginFields.password.errors.map((error) => (
                            <Input.Error
                              id={loginFields.password.errorId}
                              key={error}
                            >
                              {error}
                            </Input.Error>
                          ))
                        : null}
                      {isHydrated === true ? (
                        <Input.Controls>
                          <div className="mv-h-10 mv-w-10">
                            <CircleButton
                              type="button"
                              onClick={() => {
                                setShowPassword(!showPassword);
                              }}
                              variant="outline"
                              fullSize
                              aria-label={
                                showPassword
                                  ? locales.route.form.label.hidePassword
                                  : locales.route.form.label.showPassword
                              }
                            >
                              {showPassword ? (
                                <HidePassword />
                              ) : (
                                <ShowPassword />
                              )}
                            </CircleButton>
                          </div>
                        </Input.Controls>
                      ) : null}
                    </Input>

                    <input
                      {...getInputProps(loginFields.loginRedirect, {
                        type: "hidden",
                      })}
                      key="loginRedirect"
                    />
                    <div className="mv-mt-4 mv-mb-2">
                      <Button
                        type="submit"
                        fullSize
                        // Don't disable button when js is disabled
                        disabled={
                          isHydrated
                            ? loginForm.dirty === false ||
                              loginForm.valid === false ||
                              isSubmitting
                            : false
                        }
                      >
                        {locales.route.form.label.submit}
                      </Button>
                    </div>
                  </Form>
                  <>
                    <div className="mv-mb-6 mv-text-center">
                      <Link
                        to={`/reset${
                          loginRedirect
                            ? `?login_redirect=${loginRedirect}`
                            : ""
                        }`}
                        className="mv-text-primary mv-font-bold mv-underline"
                      >
                        {locales.route.login.passwordForgotten}
                      </Link>
                    </div>
                    <div className="mv-text-center">
                      {locales.route.login.noMember}
                    </div>
                    <div className="mv-flex mv-justify-center mv-gap-6">
                      <Link
                        to={`/register${
                          loginRedirect
                            ? `?login_redirect=${loginRedirect}`
                            : ""
                        }`}
                        className="mv-text-primary mv-font-semibold mv-underline"
                      >
                        {locales.route.login.registerByEmail}
                      </Link>
                      <Link
                        to={`/auth/keycloak${
                          loginRedirect
                            ? `?login_redirect=${loginRedirect}`
                            : ""
                        }`}
                        className="mv-text-primary mv-font-semibold mv-underline"
                      >
                        {locales.route.login.createMintId}
                      </Link>
                    </div>
                  </>
                </div>

                <div className="mv-text-center mv-p-4 mv-pb-0 mv-text-primary mv-text-sm">
                  <RichText html={locales.route.opportunities} />
                </div>
              </div>
            </div>
          </div>

          <div className="mv-absolute mv-left-1/2 mv-bottom-8 mv-hidden @md:mv-block mv-animate-bounce">
            <a href="#intro">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="55"
                height="37"
                className="mv-drop-shadow-[0px_5px_4px_0px_#FFEFFF]"
              >
                <g>
                  <path
                    fill="#154194"
                    fillRule="evenodd"
                    d="M4.531.587c.168-.186.367-.334.587-.434a1.658 1.658 0 0 1 1.385 0c.22.1.42.248.587.434L27.5 23.17 47.91.587a1.81 1.81 0 0 1 .588-.434 1.66 1.66 0 0 1 1.385 0c.22.101.419.249.587.434.168.186.301.407.392.65a2.187 2.187 0 0 1 0 1.532c-.09.243-.224.464-.392.65L28.78 27.413a1.808 1.808 0 0 1-.587.434 1.658 1.658 0 0 1-1.385 0c-.22-.1-.42-.248-.587-.434L4.53 3.419a2.025 2.025 0 0 1-.393-.65 2.185 2.185 0 0 1 0-1.532c.091-.243.225-.464.393-.65Z"
                    clipRule="evenodd"
                  />
                </g>
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section
        className="mv-py-16 @lg:mv-py-24 mv-relative mv-bg-accent-100"
        id="intro"
      >
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative">
          <div className="@md:mv-grid @md:mv-grid-cols-12 @md:mv-gap-6 @lg:mv-gap-8">
            <div className="@md:mv-col-start-2 @md:mv-col-span-10 @xl:mv-col-start-3 @xl:mv-col-span-8">
              <H3 className="mv-text-center mv-font-semibold mv-all-small-caps mv-subpixel-antialiased mv-mb-12 mv-text-primary-600 mv-text-5xl mv-leading-9">
                {locales.route.content.education.headline}
              </H3>
              <p className="mv-text-primary-600 mv-text-3xl mv-font-semibold mv-leading-8 mv-mb-12 mv-hyphens-auto">
                {insertComponentsIntoLocale(
                  locales.route.content.education.content,
                  [
                    <span
                      key="highlighted-education-content"
                      className="mv-bg-secondary-200"
                    />,
                    <span
                      key="hyphens-manual-education-content"
                      className="mv-hyphens-manual"
                    />,
                  ]
                )}
              </p>
              <div className="mv-flex mv-justify-center">
                <Button
                  as="a"
                  href={`/register${
                    loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                  }`}
                >
                  {locales.route.content.education.action}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mv-pt-16 mv-pb-10 @md:mv-pt-20 @md:mv-pb-[50px] @lg:mv-pt-24 @lg:mv-pb-[60px] mv-relative mv-bg-primary-600">
        <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-relative">
          <div className="mv-w-full mv-flex mv-flex-col mv-items-center mv-gap-12">
            <H3 className="mv-text-center mv-mb-0 mv-text-5xl mv-font-semibold mv-leading-9 mv-text-neutral-50 mv-all-small-caps mv-subpixel-antialiased">
              {locales.route.content.growth.headline}
            </H3>
            <div className="mv-flex mv-flex-col @md:mv-flex-row mv-gap-8 @lg:mv-gap-24 @xl:mv-gap-44">
              <div className="mv-text-center mv-flex mv-flex-col mv-gap-6 mv-items-center">
                <p className="mv-text-neutral-50 mv-text-[54px] mv-font-bold mv-leading-[52px]">
                  <CountUp
                    end={loaderData.profileCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="mv-text-neutral-50 mv-text-2xl mv-font-bold mv-leading-[26px]">
                  {locales.route.content.growth.profiles}
                </p>
              </div>
              <div className="mv-text-center mv-flex mv-flex-col mv-gap-6 mv-items-center">
                <p className="mv-text-neutral-50 mv-text-[54px] mv-font-bold mv-leading-[52px]">
                  <CountUp
                    end={loaderData.organizationCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="mv-text-neutral-50 mv-text-2xl mv-font-bold mv-leading-[26px]">
                  {locales.route.content.growth.organizations}
                </p>
              </div>
              <div className="mv-text-center mv-flex mv-flex-col mv-gap-6 mv-items-center">
                <p className="mv-text-neutral-50 mv-text-[54px] mv-font-bold mv-leading-[52px]">
                  <CountUp
                    end={loaderData.eventCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="mv-text-neutral-50 mv-text-2xl mv-font-bold mv-leading-[26px]">
                  {locales.route.content.growth.events}
                </p>
              </div>
              <div className="mv-text-center mv-flex mv-flex-col mv-gap-6 mv-items-center">
                <p className="mv-text-neutral-50 mv-text-[54px] mv-font-bold mv-leading-[52px]">
                  <CountUp
                    end={loaderData.projectCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="mv-text-neutral-50 mv-text-2xl mv-font-bold mv-leading-[26px]">
                  {locales.route.content.growth.projects}
                </p>
              </div>
            </div>
            <p className="mv-text-center mv-text-neutral-50 mv-text-3xl mv-font-semibold mv-leading-8">
              {locales.route.content.growth.join}
            </p>
          </div>
        </div>
      </section>

      <Roadmap locales={locales} />

      <section className="mv-flex mv-flex-col mv-items-center mv-gap-12 mv-w-full mv-py-16 @md:mv-py-24 @xl:mv-py-32 mv-px-4 @md:mv-px-20 @xl:mv-px-36 mv-bg-accent-100">
        <div className="mv-max-w-[852px]">
          <h2 className="mv-mb-12 mv-text-center mv-all-small-caps mv-subpixel-antialiased mv-text-primary-600 mv-text-5xl mv-font-semibold mv-leading-9">
            {locales.route.content.more.headline}
          </h2>
          <p className="mv-hyphens-auto mv-text-primary-600 mv-text-3xl mv-font-semibold mv-leading-8">
            {insertComponentsIntoLocale(locales.route.content.more.content, [
              <span
                key="highlighted-more-content"
                className="mv-bg-secondary-200"
              />,
            ])}
          </p>
        </div>
        <Button
          as="a"
          variant="outline"
          href="https://mint-vernetzt.de/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="mv-w-4 mv-h-4"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth=".3"
                d="M7.477 3.625a.375.375 0 0 0-.375-.375H2.125C1.504 3.25 1 3.754 1 4.375v7.5C1 12.496 1.504 13 2.125 13h7.5c.621 0 1.125-.504 1.125-1.125V6.898a.375.375 0 0 0-.75 0v4.977a.375.375 0 0 1-.375.375h-7.5a.375.375 0 0 1-.375-.375v-7.5c0-.207.168-.375.375-.375h4.977a.375.375 0 0 0 .375-.375Z"
                clipRule="evenodd"
              />
              <path
                fill="currentColor"
                fillRule="evenodd"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth=".3"
                d="M13 1.375A.375.375 0 0 0 12.625 1h-3.75a.375.375 0 1 0 0 .75h2.845L5.61 7.86a.375.375 0 0 0 .53.53l6.11-6.11v2.845a.375.375 0 0 0 .75 0v-3.75Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <span>{locales.route.content.more.action}</span>
        </Button>
      </section>
      <section className="mv-w-full mv-flex mv-flex-col mv-items-center mv-bg-neutral-50 mv-py-16 mv-px-4 @md:mv-px-10 @xl:mv-px-16 mv-relative">
        <div className="mv-absolute -mv-top-[420px] mv-right-0 mv-hidden @xl:mv-block">
          <svg
            width="174"
            height="665"
            viewBox="0 0 174 665"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M260.794 4.4861C323.496 -11.9233 396.294 32.8236 408.364 37.639C420.435 42.4545 549.313 102.592 618.226 155.899C704.368 222.533 663.364 315.887 583.041 518.216C502.718 720.545 421.822 690.638 167.082 561.128C-100.241 425.222 23.349 285.002 71.0468 201.345C118.745 117.687 198.093 20.8955 260.794 4.4861Z"
              fill="#BE88BA"
            />
          </svg>
        </div>
        <div className="mv-absolute -mv-top-[436px] mv-right-0 mv-hidden @xl:mv-block">
          <svg
            width="186"
            height="722"
            viewBox="0 0 186 722"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M726.765 408.295C718.619 476.271 646.46 530.496 637.054 540.494C627.649 550.493 518.653 653.876 439.584 700.968C340.748 759.834 264.872 683.395 97.1149 526.126C-70.642 368.858 -9.93142 300.93 215.968 100.704C453.026 -109.412 542.991 66.3363 606.746 145.6C670.501 224.864 734.911 340.319 726.765 408.295Z"
              stroke="#1B54C0"
              strokeWidth="2"
            />
          </svg>
        </div>
        <h2 className="mv-mb-[42px] mv-all-small-caps mv-subpixel-antialiased mv-text-primary-600 mv-text-5xl mv-font-semibold mv-leading-9">
          {locales.route.content.faq.headline}
        </h2>
        <div className="mv-w-full mv-mb-8 @md:mv-mb-14 @xl:mv-mb-[88px]">
          <Accordion>
            <Accordion.Item id="whatIsStem" key="whatIsStem">
              {locales.faq.stemEducation.qAndAs.whatIsStem.question}
              <RichText
                id="faq-content"
                html={locales.faq.stemEducation.qAndAs.whatIsStem.answer}
              />
            </Accordion.Item>
            <Accordion.Item id="whoIsThePlatformFor" key="whoIsThePlatformFor">
              {
                locales.faq.generalPlatformInformation.qAndAs
                  .whoIsThePlatformFor.question
              }
              <RichText
                id="faq-content"
                html={
                  locales.faq.generalPlatformInformation.qAndAs
                    .whoIsThePlatformFor.answer
                }
              />
            </Accordion.Item>
            <Accordion.Item
              id="benefitsOfThePlatform"
              key="benefitsOfThePlatform"
            >
              {
                locales.faq.generalPlatformInformation.qAndAs
                  .benefitsOfThePlatform.question
              }
              <RichText
                id="faq-content"
                html={
                  locales.faq.generalPlatformInformation.qAndAs
                    .benefitsOfThePlatform.answer
                }
              />
            </Accordion.Item>
            <Accordion.Item id="isItFree" key="isItFree">
              {locales.faq.generalPlatformInformation.qAndAs.isItFree.question}
              <RichText
                id="faq-content"
                html={
                  locales.faq.generalPlatformInformation.qAndAs.isItFree.answer
                }
              />
            </Accordion.Item>
            <Accordion.Item
              id="benefitsOfRegistration"
              key="benefitsOfRegistration"
            >
              {locales.faq.registration.qAndAs.benefitsOfRegistration.question}
              <RichText
                id="faq-content"
                html={
                  locales.faq.registration.qAndAs.benefitsOfRegistration.answer
                }
              />
            </Accordion.Item>
            <Accordion.Item id="mintId" key="mintId">
              {locales.faq.registration.qAndAs.mintId.question}
              <RichText
                id="faq-content"
                html={locales.faq.registration.qAndAs.mintId.answer}
              />
            </Accordion.Item>
          </Accordion>
        </div>
        <Button as="a" href="/help" variant="outline">
          {locales.route.content.faq.cta}
        </Button>
        <div className="mv-text-center mv-text-primary-600 mv-font-semibold mv-leading-5 mv-mt-10">
          <p>{locales.route.content.faq.supportQuestion}</p>
          <p>{locales.route.content.faq.supportCta}</p>
          <p>{locales.route.content.faq.supportEmail}</p>
        </div>
      </section>
    </>
  );
}
