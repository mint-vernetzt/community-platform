import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { utcToZonedTime } from "date-fns-tz";
import { useRef } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { HoneypotInputs } from "remix-utils/honeypot/react";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import BetaTag from "~/components-next/BetaTag";
import { External } from "~/components-next/icons/External";
import { Icon } from "~/components-next/icons/Icon";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { checkHoneypot } from "~/honeypot.server";
import { HONEYPOT_CLASSNAME } from "~/honeypot.shared";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { getDateDuration } from "~/lib/utils/time";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { isBotRequest } from "~/utils.server";
import { login } from "../login/index.server";
import { createLoginSchema } from "../login/index.shared";
import { getDataForToolsSection } from "../resources";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "../utils.server";
import {
  getEventTeaserOrganizationSlug,
  getProjectTeaserOrganizationSlug,
  getUpcomingEvents,
} from "./index.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, ["next_landingpage"]);

  let isBot = false;
  if (process.env.NODE_ENV !== "test") {
    isBot = isBotRequest(request.headers.get("user-agent"));
  }

  const sessionUser = await getSessionUser(authClient);
  if (sessionUser !== null) {
    // Default redirect on logged in user
    return redirect("/dashboard");
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/index"];

  const profileCount = await getProfileCount();
  const organizationCount = await getOrganizationCount();
  const projectCount = await getProjectCount();
  const eventCount = await getEventCount();

  const projectTeaserOrganizationSlug =
    await getProjectTeaserOrganizationSlug();
  const upcomingEvents = await getUpcomingEvents();
  const eventTeaserOrganizationSlug = await getEventTeaserOrganizationSlug();

  return {
    locales,
    language,
    isBot,
    profileCount,
    organizationCount,
    projectCount,
    eventCount,
    projectTeaserOrganizationSlug,
    upcomingEvents,
    eventTeaserOrganizationSlug,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, ["next_landingpage"]);

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/index"];

  // Conform
  const formData = await request.formData();
  if (process.env.NODE_ENV !== "test") {
    await checkHoneypot(formData);
    const isBot = isBotRequest(request.headers.get("user-agent"));
    invariantResponse(
      isBot === false,
      "Bots are not allowed to access this resource",
      { status: 403 }
    );
  }
  const { submission } = await login({
    formData,
    request,
    authClient,
    locales,
  });

  if (submission.status !== "success") {
    const reply = submission.reply();
    const replyWithoutPassword = {
      ...reply,
      initialValue: {
        loginRedirect: submission.payload.loginRedirect.toString(),
        email: submission.payload.email.toString(),
        password: "", // Don't return password to client
      },
    };
    return replyWithoutPassword;
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
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();

  const loginRedirect = urlSearchParams.get("login_redirect");

  const [loginForm, loginFields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(createLoginSchema(locales)),
    defaultValue: {
      email:
        typeof actionData?.initialValue?.email === "string"
          ? actionData?.initialValue?.email
          : "",
      password: "",
      loginRedirect: loginRedirect,
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : null,
    onValidate({ formData }) {
      const submission = parseWithZod(formData, {
        schema: createLoginSchema(locales),
      });
      return submission;
    },
  });

  const toolKeys = [
    "fundingSearch",
    "sharepic",
    "mediaDatabase",
    "oeb",
  ] as const;
  const toolsSectionData = getDataForToolsSection();
  const toolsSliderRef = useRef<HTMLDivElement>(null);

  function scrollToolsSlider(direction: "previous" | "next") {
    const slider = toolsSliderRef.current;
    if (slider === null) {
      return;
    }
    const firstCard = slider.firstElementChild;
    if (firstCard === null) {
      return;
    }
    const scrollAmount = firstCard.clientWidth + 24;
    if (direction === "previous") {
      slider.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      slider.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  }

  return (
    <>
      <section className="relative overflow-hidden bg-secondary-50 bg-linear-[358deg] from-neutral-50 from-[12.78%] via-neutral-50/40 via-[74.48%] to-neutral-50/40 to-[98.12%]">
        <div className="absolute -top-90 -right-102.5 hidden @md:block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 945 947"
            width="838"
            height="849"
            fill="none"
            aria-hidden="true"
          >
            <path
              fill="#FFCF53"
              d="M508.34 945.443c-89.582 9.463-180.276-67.216-195.857-76.352-15.581-9.136-180.122-118.666-263.692-206.297-104.462-109.538-28.635-229.26 123.96-490.517 152.596-261.258 257.514-203.28 580.525 27.841 338.964 242.537 139.878 409.42 56.878 514.42-83 105-212.232 221.442-301.814 230.905Z"
            />
          </svg>
        </div>

        <div className="py-16 @lg:py-20 relative min-h-[calc(100dvh-76px)] lg:min-h-[calc(100dvh-80px)] @md:flex @md:items-center">
          <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
            <div className="@md:grid @md:grid-cols-12 @md:gap-6 @lg:gap-8 @md:items-center">
              <div className="@md:col-start-1 @md:col-span-6 @xl:col-start-2 @xl:col-span-5">
                <h1 className="mb-8 text-primary-600 text-5xl leading-tight @lg:text-[3.75rem] @lg:leading-[4.5rem] @lg:tracking-[-2.4px] font-black hyphens-auto @lg:hyphens-none">
                  {locales.content.headline}
                </h1>
                <p className="mb-8 @md:mb-0 text-neutral-800 text-lg leading-[1.3] tracking-[0.18px] font-semibold">
                  {locales.content.intro}
                </p>
              </div>

              <div className="@md:col-start-9 @md:col-span-4 @xl:col-start-8">
                <div className="p-6 bg-white rounded-3xl shadow-[0px_4px_24px_0px_rgba(17,52,118,0.12)]">
                  <div className="text-center">
                    <a
                      id="login-start"
                      href="#login-end"
                      className="w-0 h-0 opacity-0 focus:w-fit focus:h-fit focus:opacity-100 focus:px-1"
                    >
                      {locales.login.skip.start}
                    </a>
                    <Button
                      as="link"
                      size="large"
                      to={`/auth/keycloak${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      variant="outline"
                      fullSize
                      name={locales.login.withMintId}
                    >
                      {locales.login.withMintId}
                    </Button>
                    <Link
                      to="https://mint-id.org/faq"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block py-2 text-primary font-semibold underline"
                    >
                      {locales.login.moreInformation}
                    </Link>
                    <div className="mt-4 mb-4">
                      <hr className="mx-5" />
                      <span className="block -my-3 mx-auto w-fit px-4 text-primary bg-white font-bold">
                        {locales.login.or}
                      </span>
                    </div>
                  </div>
                  {loaderData.isBot === false && (
                    <Form
                      {...getFormProps(loginForm)}
                      method="post"
                      autoComplete="off"
                    >
                      <HoneypotInputs className={HONEYPOT_CLASSNAME} />
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
                          {...getInputProps(loginFields.email, {
                            type: "text",
                          })}
                          key="email"
                        >
                          <Input.Label htmlFor={loginFields.email.id}>
                            {locales.form.label.email}
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
                          type: "password",
                        })}
                        key="password"
                      >
                        <Input.Label htmlFor={loginFields.password.id}>
                          {locales.form.label.password}
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
                          {locales.form.label.submit}
                        </Button>
                      </div>
                    </Form>
                  )}
                  <div className="mb-4 text-center">
                    <Link
                      to={`/reset${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      className="text-primary font-bold underline"
                      prefetch="intent"
                    >
                      {locales.login.passwordForgotten}
                    </Link>
                  </div>
                  <div className="text-center">{locales.login.noMember}</div>
                  <div className="flex justify-center gap-6">
                    <Link
                      to={`/register${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      className="text-primary font-semibold underline"
                      prefetch="intent"
                    >
                      {locales.login.registerByEmail}
                    </Link>
                    <Link
                      to={`/auth/keycloak${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      className="text-primary font-semibold underline"
                    >
                      {locales.login.createMintId}
                    </Link>
                  </div>
                  <div className="w-full flex justify-center">
                    <a
                      id="login-end"
                      href="#login-start"
                      className="w-0 h-0 opacity-0 focus:w-fit focus:h-fit focus:opacity-100 focus:px-1"
                    >
                      {locales.login.skip.end}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 @lg:mt-24 grid grid-cols-2 @md:grid-cols-4 gap-8 @md:gap-16 text-center">
              <div className="flex flex-col gap-1">
                <p className="text-primary-500 text-5xl leading-10 font-bold">
                  {loaderData.profileCount}
                </p>
                <p className="text-primary-500 text-lg leading-[22px] font-semibold">
                  {locales.counter.profiles}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-primary-500 text-5xl leading-10 font-bold">
                  {loaderData.organizationCount}
                </p>
                <p className="text-primary-500 text-lg leading-[22px] font-semibold">
                  {locales.counter.organizations}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-primary-500 text-5xl leading-10 font-bold">
                  {loaderData.eventCount}
                </p>
                <p className="text-primary-500 text-lg leading-[22px] font-semibold">
                  {locales.counter.events}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-primary-500 text-5xl leading-10 font-bold">
                  {loaderData.projectCount}
                </p>
                <p className="text-primary-500 text-lg leading-[22px] font-semibold">
                  {locales.counter.projects}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 relative">
        <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
          <div className="@md:grid @md:grid-cols-12 @md:gap-6 @lg:gap-8 @md:items-center">
            <div className="@md:col-start-1 @md:col-span-5">
              <h2 className="mb-6 text-primary-600 text-[2rem] leading-9 tracking-[-0.64px] font-bold">
                {locales.eventTeaser.headline}
              </h2>
              <ul className="mb-8 flex flex-col gap-4">
                {[
                  locales.eventTeaser.benefits.formats,
                  locales.eventTeaser.benefits.knowledge,
                  locales.eventTeaser.benefits.ownEvents,
                ].map((benefit) => {
                  return (
                    <li
                      key={benefit}
                      className="flex items-center gap-3 text-neutral-800 text-lg leading-[1.3] tracking-[0.18px] font-semibold"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="shrink-0"
                      >
                        <circle cx="12" cy="12" r="12" fill="#EDF3FF" />
                        <path
                          d="M7.59888 13.1995L10.5989 15.7995L17.1989 7.99951"
                          stroke="#703D6B"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  );
                })}
              </ul>
              <Button
                as="link"
                to="/explore/events"
                variant="outline"
                prefetch="intent"
              >
                {locales.eventTeaser.allEvents}
              </Button>
            </div>

            <div className="mt-8 @md:mt-0 @md:col-start-7 @md:col-span-6">
              <div className="relative w-full aspect-3/2 rounded-2xl overflow-hidden">
                <Image
                  src="/images/MINTvernetzt_tag.jpg"
                  alt={locales.eventTeaser.image.alt}
                >
                  <Image.Credits credits={locales.eventTeaser.image.credits} />
                </Image>
                {loaderData.eventTeaserOrganizationSlug !== null ? (
                  <Link
                    to={`/organization/${loaderData.eventTeaserOrganizationSlug}/detail/about`}
                    prefetch="intent"
                    className="absolute top-4 left-4 h-8 flex items-center gap-2.5 py-1 pl-1 pr-2 bg-neutral-800/60 rounded-lg"
                  >
                    <img
                      src="/images/mint-vernetzt_shortlogo.png"
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-neutral-50 text-xs leading-4 font-semibold">
                      MINTvernetzt
                    </span>
                  </Link>
                ) : (
                  <div className="absolute top-4 left-4 h-8 flex items-center gap-2.5 py-1 pl-1 pr-2 bg-neutral-800/60 rounded-lg">
                    <img
                      src="/images/mint-vernetzt_shortlogo.png"
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-neutral-50 text-xs leading-4 font-semibold">
                      MINTvernetzt
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-4 @lg:mb-6 text-primary-600 text-lg leading-6 font-bold">
              {locales.eventTeaser.upcomingEvents.headline}
            </h3>
            {loaderData.upcomingEvents.length === 0 ? (
              <p className="text-neutral-700 text-base leading-5">
                {locales.eventTeaser.upcomingEvents.empty}
              </p>
            ) : (
              <ul className="grid grid-cols-1 @md:grid-cols-3 gap-4 @lg:gap-6">
                {loaderData.upcomingEvents.map((event) => {
                  const startTime = utcToZonedTime(
                    event.startTime,
                    "Europe/Berlin"
                  );
                  const endTime = utcToZonedTime(
                    event.endTime,
                    "Europe/Berlin"
                  );
                  return (
                    <li key={event.slug}>
                      <Link
                        to={`/event/${event.slug}`}
                        prefetch="intent"
                        className="group block h-full p-4 bg-white rounded-lg border border-neutral-200"
                      >
                        <p className="mb-2 text-neutral-700 text-sm leading-5 font-semibold">
                          {getDateDuration(
                            startTime,
                            endTime,
                            loaderData.language
                          )}
                        </p>
                        <p className="text-primary-600 text-sm leading-5 font-bold group-hover:underline">
                          {event.name}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 @md:py-12.5 @lg:py-15 bg-neutral-50">
        <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl bg-primary-400 px-6 py-8 @md:px-10 @md:py-10 @lg:px-12 @lg:py-12">
            <img
              src="/images/bubble-grafik-blau.svg"
              alt=""
              className="absolute top-30 right-[-16%] w-[54%] max-w-none hidden @md:block @lg:top-25 @lg:right-[-17%] @lg:w-[68%] @xl:top-15 @xl:right-[-13%] @xl:w-[52%]"
            />

            <div className="relative @md:w-2/3 @lg:w-1/2">
              <h2 className="mb-4 text-neutral-50 text-3xl leading-tight @lg:text-4xl @lg:leading-[2.75rem] font-bold hyphens-auto @lg:hyphens-none">
                {locales.funding.headline}
              </h2>
              <p className="mb-8 text-neutral-50 text-base leading-[1.3] tracking-[0.16px] font-semibold">
                {locales.funding.info}
              </p>
              <Link
                to="/explore/fundings"
                className="inline-flex items-center justify-center px-6 py-2 bg-neutral-50 text-primary-500 rounded-lg text-center leading-6 font-semibold hover:bg-neutral-100"
                prefetch="intent"
              >
                {locales.funding.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 relative">
        <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl relative">
          <div className="@md:grid @md:grid-cols-12 @md:gap-6 @lg:gap-8 @md:items-center">
            <div className="mb-8 @md:mb-0 @md:row-start-1 @md:col-start-1 @md:col-span-6">
              <div className="relative w-full aspect-3/2 rounded-2xl overflow-hidden">
                <Image
                  src="/images/jasminmertikat.jpg"
                  alt={locales.projectTeaser.image.alt}
                >
                  <Image.Credits
                    credits={locales.projectTeaser.image.credits}
                  />
                </Image>
                {loaderData.projectTeaserOrganizationSlug !== null ? (
                  <Link
                    to={`/organization/${loaderData.projectTeaserOrganizationSlug}/detail/about`}
                    prefetch="intent"
                    className="absolute top-4 left-4 h-8 flex items-center gap-2.5 py-1 pl-1 pr-2 bg-neutral-800/60 rounded-lg"
                  >
                    <img
                      src="/images/tinkertank_shortlogo.jpg"
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-neutral-50 text-xs leading-4 font-semibold">
                      Tinkertank
                    </span>
                  </Link>
                ) : (
                  <div className="absolute top-4 left-4 h-8 flex items-center gap-2.5 py-1 pl-1 pr-2 bg-neutral-800/60 rounded-lg">
                    <img
                      src="/images/tinkertank_shortlogo.jpg"
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-neutral-50 text-xs leading-4 font-semibold">
                      Tinkertank
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="@md:row-start-1 @md:col-start-8 @md:col-span-5">
              <h2 className="mb-6 text-primary-600 text-[2rem] leading-9 tracking-[-0.64px] font-bold">
                {locales.projectTeaser.headline}
              </h2>
              <ul className="mb-8 flex flex-col gap-4">
                {[
                  locales.projectTeaser.benefits.ideas,
                  locales.projectTeaser.benefits.cooperations,
                  locales.projectTeaser.benefits.ownProjects,
                  locales.projectTeaser.benefits.learn,
                ].map((benefit) => {
                  return (
                    <li
                      key={benefit}
                      className="flex items-center gap-3 text-neutral-800 text-lg leading-[1.3] tracking-[0.18px] font-semibold"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="shrink-0"
                      >
                        <circle cx="12" cy="12" r="12" fill="#EDF3FF" />
                        <path
                          d="M7.59888 13.1995L10.5989 15.7995L17.1989 7.99951"
                          stroke="#703D6B"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  );
                })}
              </ul>
              <Button
                as="link"
                to="/explore/projects"
                variant="outline"
                prefetch="intent"
              >
                {locales.projectTeaser.allProjects}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 @lg:py-24">
        <div className="w-full mx-auto px-4 @sm:max-w-sm @md:max-w-md @lg:max-w-lg @xl:max-w-xl @xl:px-6 @2xl:max-w-2xl">
          <h2 className="mb-12 text-center text-primary-600 text-3xl @lg:text-4xl font-bold">
            {locales.tools.headline}
          </h2>
          <div
            ref={toolsSliderRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden @xl:scroll-pl-12"
          >
            {toolKeys.map((toolKey) => {
              const tool = toolsSectionData[toolKey];
              const toolLocales = locales.tools[toolKey];

              return (
                <div
                  key={toolKey}
                  className="flex-none w-full @md:w-[calc(50%-12px)] @xl:w-[calc(50%-60px)] snap-start flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden"
                >
                  <div className={`w-full h-64 ${tool.bgClassName ?? ""}`}>
                    <Image
                      src={tool.imagePath}
                      blurredSrc={tool.blurredImagePath}
                      alt={toolLocales.imgAlt}
                    />
                  </div>
                  <div className="grow flex flex-col gap-4 p-6">
                    <div className="flex items-center gap-2">
                      <h3 className="mb-0 text-primary text-xl font-bold leading-6">
                        {toolLocales.headline}
                      </h3>
                      {tool.beta ? <BetaTag /> : null}
                    </div>
                    <p className="text-neutral-600 text-base leading-5">
                      {toolLocales.content}
                    </p>
                    <div className="mt-auto">
                      <Button
                        as="link"
                        variant="outline"
                        to={tool.link}
                        rel={tool.external ? "noopener noreferrer" : undefined}
                        target={tool.external ? "_blank" : undefined}
                        prefetch={tool.external ? "none" : "intent"}
                        className="w-full @lg:w-fit"
                      >
                        {tool.external ? (
                          <span>
                            <External />
                          </span>
                        ) : null}
                        <span>{toolLocales.action}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => scrollToolsSlider("previous")}
              aria-label={locales.tools.slider.previous}
              className="w-10 h-10 flex items-center justify-center bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100"
            >
              <Icon
                type="chevron-right"
                className="rotate-180"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => scrollToolsSlider("next")}
              aria-label={locales.tools.slider.next}
              className="w-10 h-10 flex items-center justify-center bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100"
            >
              <Icon type="chevron-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
