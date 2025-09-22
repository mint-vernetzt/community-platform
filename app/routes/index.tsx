import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Roadmap } from "@mint-vernetzt/components/src/organisms/Roadmap";
import { useState } from "react";
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
import { H1 } from "~/components/Heading/Heading";
import { RichText } from "~/components/Richtext/RichText";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
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
import { TextButton } from "@mint-vernetzt/components/src/molecules/TextButton";
import { ShowPasswordButton } from "~/components-next/ShowPasswordButton";
import { PublicVisibility } from "~/components-next/icons/PublicVisibility";
import { PrivateVisibility } from "~/components-next/icons/PrivateVisibility";

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
      email:
        typeof actionData?.submission?.initialValue?.email === "string"
          ? actionData?.submission?.initialValue?.email
          : "",
      password:
        typeof actionData?.submission?.initialValue?.password === "string"
          ? actionData?.submission?.initialValue?.password
          : "",
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onBlur",
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
      <section className="bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)]">
        <div className="py-16 @lg:py-20 relative overflow-hidden min-h-[calc(100dvh-76px)] lg:min-h-[calc(100dvh-80px)] @md:flex @md:items-center">
          <div className="absolute top-[50%] left-0 -ml-[250px] mt-[200px] hidden @lg:block">
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

          <div className="absolute top-[-80px] left-1/2 ml-[400px] hidden @lg:block">
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

          <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
            <div className="@md:grid @md:grid-cols-12 @md:gap-6 @lg:gap-8">
              <div className="@md:col-start-1 @md:col-span-7 @xl:col-start-2 @xl:col-span-5 @md:flex @md:items-center">
                <div>
                  <H1 className="text-center @sm:text-left text-primary-600 text-7xl font-black leading-[52px]">
                    {locales.route.welcome}
                  </H1>
                  <p className="mt-8 mb-8 @lg:mb-0 text-primary-600 font-semibold leading-5">
                    {locales.route.intro}
                  </p>
                </div>
              </div>

              <div className="@md:col-start-8 @md:col-span-5 @lg:col-start-9 @lg:col-span-4 @xl:col-start-8 @xl:col-span-4">
                <div className="py-8 bg-transparent @sm:bg-neutral-50 @sm:rounded-3xl @sm:p-8 @sm:shadow-[4px_5px_26px_-8px_rgba(177,111,171,0.95)]">
                  <div className="text-center">
                    <a
                      id="login-start"
                      href="#login-end"
                      className="w-0 h-0 opacity-0 focus:w-fit focus:h-fit focus:opacity-100 focus:px-1"
                    >
                      {locales.route.login.skip.start}
                    </a>
                    <Button
                      as="link"
                      size="large"
                      to={`/auth/keycloak${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      variant="outline"
                      fullSize
                      name={locales.route.login.withMintId}
                    >
                      {locales.route.login.withMintId}
                    </Button>
                    <Link
                      to="https://mint-id.org/faq"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block py-2 text-primary font-semibold underline"
                    >
                      {locales.route.login.moreInformation}
                    </Link>
                    <div className="mt-4 mb-8">
                      <hr className="mx-5" />
                      <span className="block -my-3 mx-auto w-fit px-4 text-primary bg-white @sm:bg-neutral-50 font-bold">
                        {locales.route.login.or}
                      </span>
                    </div>
                  </div>
                  <Form
                    {...getFormProps(loginForm)}
                    method="post"
                    autoComplete="off"
                  >
                    {typeof loginForm.errors !== "undefined" &&
                    loginForm.errors.length > 0 ? (
                      <div>
                        {loginForm.errors.map((error, index) => {
                          return (
                            <div
                              key={index}
                              className="p-3 mb-3 bg-negative-100 text-negative-900 rounded-md"
                            >
                              <RichText id={loginForm.errorId} html={error} />
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="mb-4">
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
                          <div className="h-10 w-10">
                            <ShowPasswordButton
                              onClick={() => {
                                setShowPassword(!showPassword);
                              }}
                              aria-label={
                                showPassword
                                  ? locales.route.form.label.hidePassword
                                  : locales.route.form.label.showPassword
                              }
                            >
                              {showPassword ? (
                                <PublicVisibility aria-hidden="true" />
                              ) : (
                                <PrivateVisibility aria-hidden="true" />
                              )}
                            </ShowPasswordButton>
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
                    <div className="mt-4 mb-2">
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
                    <div className="mb-6 text-center">
                      <Link
                        to={`/reset${
                          loginRedirect
                            ? `?login_redirect=${loginRedirect}`
                            : ""
                        }`}
                        className="text-primary font-bold underline"
                        prefetch="intent"
                      >
                        {locales.route.login.passwordForgotten}
                      </Link>
                    </div>
                    <div className="text-center">
                      {locales.route.login.noMember}
                    </div>
                    <div className="flex justify-center gap-6">
                      <Link
                        to={`/register${
                          loginRedirect
                            ? `?login_redirect=${loginRedirect}`
                            : ""
                        }`}
                        className="text-primary font-semibold underline"
                        prefetch="intent"
                      >
                        {locales.route.login.registerByEmail}
                      </Link>
                      <Link
                        to={`/auth/keycloak${
                          loginRedirect
                            ? `?login_redirect=${loginRedirect}`
                            : ""
                        }`}
                        className="text-primary font-semibold underline"
                      >
                        {locales.route.login.createMintId}
                      </Link>
                    </div>
                  </>
                  <div className="w-full flex justify-center">
                    <a
                      id="login-end"
                      href="#login-start"
                      className="w-0 h-0 opacity-0 focus:w-fit focus:h-fit focus:opacity-100 focus:px-1"
                    >
                      {locales.route.login.skip.end}
                    </a>
                  </div>
                </div>

                <div className="text-center p-4 pb-0 text-primary text-sm">
                  <RichText html={locales.route.opportunities} />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 bottom-8 hidden @md:block animate-bounce">
            <Link to="#intro" aria-label={locales.route.content.intro}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="55"
                height="37"
                className="drop-shadow-[0px_5px_4px_0px_#FFEFFF]"
                aria-hidden="true"
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
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 @lg:py-24 relative bg-accent-100">
        <div id="intro" className="absolute -top-[76px] xl:-top-20" />
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
          <div className="@md:grid @md:grid-cols-12 @md:gap-6 @lg:gap-8">
            <div className="@md:col-start-2 @md:col-span-10 @xl:col-start-3 @xl:col-span-8">
              <h2 className="text-center font-semibold all-small-caps subpixel-antialiased mb-12 text-primary-600 text-5xl leading-9">
                {locales.route.content.education.headline}
              </h2>
              <p className="text-primary-600 text-3xl font-semibold leading-8 mb-12 hyphens-auto">
                {insertComponentsIntoLocale(
                  locales.route.content.education.content,
                  [
                    <span
                      key="highlighted-education-content"
                      className="bg-secondary-200"
                    />,
                    <span
                      key="hyphens-manual-education-content"
                      className="hyphens-manual"
                    />,
                  ]
                )}
              </p>
              <div className="flex justify-center">
                <Button
                  as="link"
                  to={`/register${
                    loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                  }`}
                  prefetch="intent"
                >
                  {locales.route.content.education.action}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-16 pb-10 @md:pt-20 @md:pb-[50px] @lg:pt-24 @lg:pb-[60px] relative bg-primary-600">
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl relative">
          <div className="w-full flex flex-col items-center gap-12">
            <h2 className="text-center mb-0 text-5xl font-semibold leading-9 text-neutral-50 all-small-caps subpixel-antialiased">
              {locales.route.content.growth.headline}
            </h2>
            <div className="flex flex-col @md:flex-row gap-8 @lg:gap-24 @xl:gap-44">
              <div className="text-center flex flex-col gap-6 items-center">
                <p className="text-neutral-50 text-[54px] font-bold leading-[52px]">
                  <CountUp
                    end={loaderData.profileCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="text-neutral-50 text-2xl font-bold leading-[26px]">
                  {locales.route.content.growth.profiles}
                </p>
              </div>
              <div className="text-center flex flex-col gap-6 items-center">
                <p className="text-neutral-50 text-[54px] font-bold leading-[52px]">
                  <CountUp
                    end={loaderData.organizationCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="text-neutral-50 text-2xl font-bold leading-[26px]">
                  {locales.route.content.growth.organizations}
                </p>
              </div>
              <div className="text-center flex flex-col gap-6 items-center">
                <p className="text-neutral-50 text-[54px] font-bold leading-[52px]">
                  <CountUp
                    end={loaderData.eventCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="text-neutral-50 text-2xl font-bold leading-[26px]">
                  {locales.route.content.growth.events}
                </p>
              </div>
              <div className="text-center flex flex-col gap-6 items-center">
                <p className="text-neutral-50 text-[54px] font-bold leading-[52px]">
                  <CountUp
                    end={loaderData.projectCount}
                    enableScrollSpy={true}
                    scrollSpyDelay={100}
                    scrollSpyOnce={true}
                    separator="."
                  />
                </p>
                <p className="text-neutral-50 text-2xl font-bold leading-[26px]">
                  {locales.route.content.growth.projects}
                </p>
              </div>
            </div>
            <p className="text-center text-neutral-50 text-3xl font-semibold leading-8">
              {locales.route.content.growth.join}
            </p>
          </div>
        </div>
      </section>

      <Roadmap locales={locales} />

      <section className="flex flex-col items-center gap-12 w-full py-16 @md:py-24 @xl:py-32 px-4 @md:px-20 @xl:px-36 bg-accent-100">
        <div className="max-w-[852px]">
          <h2 className="mb-12 text-center all-small-caps subpixel-antialiased text-primary-600 text-5xl font-semibold leading-9">
            {locales.route.content.more.headline}
          </h2>
          <p className="hyphens-auto text-primary-600 text-3xl font-semibold leading-8">
            {insertComponentsIntoLocale(locales.route.content.more.content, [
              <span
                key="highlighted-more-content"
                className="bg-secondary-200"
              />,
            ])}
          </p>
        </div>
        <Button
          as="link"
          variant="outline"
          to="https://mint-vernetzt.de/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="w-4 h-4"
              aria-hidden="true"
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
      <section className="w-full flex flex-col items-center bg-neutral-50 py-16 px-4 @md:px-10 @xl:px-16 relative">
        <div className="absolute -top-[420px] right-0 hidden @xl:block">
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
        <div className="absolute -top-[436px] right-0 hidden @xl:block">
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
        <h2 className="mb-[42px] all-small-caps subpixel-antialiased text-primary-600 text-5xl font-semibold leading-9">
          {locales.route.content.faq.headline}
        </h2>
        <div className="w-full mb-8 @md:mb-14 @xl:mb-[88px]">
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
        <Button as="link" to="/help" variant="outline" prefetch="intent">
          {locales.route.content.faq.cta}
        </Button>
        <div className="flex flex-col items-center text-center text-primary-600 font-semibold leading-5 mt-10">
          <p>{locales.route.content.faq.supportQuestion}</p>
          <p>{locales.route.content.faq.supportCta}</p>
          <TextButton
            as="link"
            to={`mailto:${locales.route.content.faq.supportEmail}`}
          >
            {locales.route.content.faq.supportEmail}
          </TextButton>
        </div>
      </section>
    </>
  );
}
