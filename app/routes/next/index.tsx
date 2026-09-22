import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import {
  getImageLabelClassName,
  Image,
} from "@mint-vernetzt/components/src/molecules/Image";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { useEffect, useRef, useState, type TouchEvent } from "react";
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
import eventSectionBlurredImage from "~/assets/landing-page/MINTvernetzt_Tag_01_Foto_Andi_Weiland-125-blurred.webp";
import eventSectionImage from "~/assets/landing-page/MINTvernetzt_Tag_01_Foto_Andi_Weiland-125.jpg";
import mvLogoBlurred from "~/assets/landing-page/mv-logo-blurred.webp";
import mvLogo from "~/assets/landing-page/mv-logo.png";
import projectTeaserImage from "~/assets/landing-page/Jasmin Mertikat 1.jpg";
import projectTeaserImageBlurred from "~/assets/landing-page/Jasmin Mertikat 1-blurred.webp";
import tinkertankLogo from "~/assets/landing-page/tinkertank-logo.jpg";
import tinkertankLogoBlurred from "~/assets/landing-page/tinkertank-logo-blurred.webp";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { Accordion } from "~/components-next/Accordion";
import { ShowPasswordButton } from "~/components-next/ShowPasswordButton";
import { External } from "~/components-next/icons/External";
import { Icon } from "~/components-next/icons/Icon";
import { PrivateVisibility } from "~/components-next/icons/PrivateVisibility";
import { PublicVisibility } from "~/components-next/icons/PublicVisibility";
import { RichText } from "~/components/legacy/Richtext/RichText";
import ListItemEvent from "~/components/next/ListItemEvent";
import { checkHoneypot } from "~/honeypot.server";
import { HONEYPOT_CLASSNAME } from "~/honeypot.shared";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { isBotRequest } from "~/utils.server";
import { hasContent } from "~/utils.shared";
import { login } from "../login/index.server";
import { createLoginSchema } from "../login/index.shared";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "../utils.server";
import {
  getDataForCommunityImages,
  getDataForToolsSection,
  getEventTeaserOrganization,
  getProjectTeaserOrganization,
  getTestimonials,
  getUpcomingEvents,
} from "./index.server";
import {
  FundingSectionBobbel,
  LoginSectionBobbel,
  PiggyBank,
} from "./index.shared";

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

  const eventTeaserOrganization = await getEventTeaserOrganization();
  const upcomingEvents = await getUpcomingEvents();

  const projectTeaserOrganization = await getProjectTeaserOrganization();

  const toolsSectionData = getDataForToolsSection();

  const communityImages = getDataForCommunityImages();

  const testimonials = await getTestimonials();

  return {
    locales,
    language,
    isBot,
    profileCount,
    organizationCount,
    projectCount,
    eventCount,
    upcomingEvents,
    testimonials,
    toolsSectionData,
    eventTeaserOrganization,
    projectTeaserOrganization,
    communityImages,
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
    locales: locales.route,
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
  const { locales, communityImages, toolsSectionData } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();

  const loginRedirect = urlSearchParams.get("login_redirect");

  // Login Section logic
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, loginFields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(createLoginSchema(locales.route)),
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
        schema: createLoginSchema(locales.route),
      });
      return submission;
    },
  });

  // Tools Section logic
  const toolsSliderRef = useRef<HTMLUListElement>(null);
  const [scrollAmount, setScrollAmount] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  useEffect(() => {
    const slider = toolsSliderRef.current;
    if (slider === null) {
      return;
    }
    setMaxScroll(slider.scrollWidth - slider.getBoundingClientRect().width);
    setScrollAmount(slider.scrollLeft);

    const handleScroll = () => {
      if (slider === null) {
        return;
      }
      setScrollAmount(slider.scrollLeft);
    };
    slider.addEventListener("scroll", handleScroll);

    const handleResize = () => {
      if (slider === null) {
        return;
      }
      setMaxScroll(slider.scrollWidth - slider.clientWidth);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      slider.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToolsSlider(direction: "previous" | "next") {
    const slider = toolsSliderRef.current;
    if (slider === null) {
      return;
    }
    const firstCard = slider.firstElementChild;
    if (firstCard === null) {
      return;
    }
    const newScrollAmount = firstCard.clientWidth + 24;
    if (direction === "previous") {
      slider.scrollBy({ left: -newScrollAmount, behavior: "smooth" });
    } else {
      slider.scrollBy({ left: newScrollAmount, behavior: "smooth" });
    }
    setScrollAmount(slider.scrollLeft);
  }

  // Community Section logic
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (autoPlay === false) {
      return;
    }
    const interval = setInterval(() => {
      setActiveSlide(
        (currentSlide) => (currentSlide + 1) % communityImages.length
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPlay, communityImages.length]);

  const minSwipeDistance = 50;

  const onTouchStart = (event: TouchEvent<HTMLUListElement>) => {
    setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
    setTouchStart(event.targetTouches[0].clientX);
  };

  const onTouchMove = (event: TouchEvent<HTMLUListElement>) =>
    setTouchEnd(event.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setActiveSlide(
        (currentSlide) => (currentSlide + 1) % communityImages.length
      );
    }
    if (isRightSwipe) {
      setActiveSlide(
        (currentSlide) =>
          (currentSlide - 1 + communityImages.length) % communityImages.length
      );
    }
    setAutoPlay(false);
  };

  const onClick = (index: number) => {
    setActiveSlide(index);
    setAutoPlay(false);
  };

  // Testimonials Section logic
  const testimonialListRef = useRef<HTMLUListElement>(null);

  const scrollTestimonials = (direction: "previous" | "next") => {
    const list = testimonialListRef.current;
    if (list === null) {
      return;
    }
    const firstItem = list.firstElementChild;
    if (firstItem instanceof HTMLElement === false) {
      return;
    }
    // Card width + gap
    const scrollAmount = firstItem.offsetWidth + 24;
    list.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Header & Login section */}
      <section className="relative isolate md:bg-secondary-50 md:bg-linear-[358deg] md:from-neutral-50 md:from-[12.78%] md:via-neutral-50/40 md:via-[74.48%] md:to-neutral-50/40 md:to-[98.12%]">
        <div className="w-full flex flex-col xl:justify-between md:flex-row md:items-center max-w-2xl mx-auto">
          <div className="flex flex-col gap-8 md:gap-6 pl-4 md:pl-10 xl:pl-16 pr-4 md:pr-8 pb-4 md:pb-16 pt-16">
            <h1 className="mb-0 w-full text-center md:text-start text-primary-600 text-5xl md:text-[60px] font-black leading-9 md:leading-18">
              {locales.route.content.headline}
            </h1>
            <p className="w-full md:max-w-99.5 text-center md:text-start text-neutral-800 text-lg font-semibold leading-6">
              {locales.route.content.intro}
            </p>
          </div>

          <div className="md:pr-10 xl:pr-16 md:pb-16 md:pt-16">
            <div className="flex flex-col gap-4 px-4 md:px-6 pb-12 md:pb-6 pt-4 md:pt-6 md:bg-white md:rounded-2xl md:shadow-[2px_2px_16px_-8px_rgba(177,111,171,0.79)]">
              <a
                id="login-start"
                href="#login-end"
                className="absolute focus:relative w-0 h-0 opacity-0 focus:w-fit focus:h-fit focus:opacity-100 focus:px-1"
              >
                {locales.route.login.skip.start}
              </a>
              <div className="flex flex-col gap-2 items-center">
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
                  className="text-primary font-bold underline text-base leading-5"
                >
                  {locales.route.login.moreInformation}
                </Link>
              </div>
              <div>
                <hr />
                <span className="block -my-3.5 mx-auto w-fit px-4 text-primary bg-white @sm:bg-neutral-50 font-bold">
                  {locales.route.login.or}
                </span>
              </div>
              {loaderData.isBot === false && (
                <Form
                  {...getFormProps(loginForm)}
                  method="post"
                  autoComplete="off"
                  className="flex flex-col gap-8 md:gap-4"
                >
                  <HoneypotInputs className={HONEYPOT_CLASSNAME} />
                  {typeof loginForm.errors !== "undefined" &&
                  loginForm.errors.length > 0
                    ? loginForm.errors.map((error, index) => {
                        return (
                          <div key={index}>
                            <RichText id={loginForm.errorId} html={error} />
                          </div>
                        );
                      })
                    : null}

                  <div className="flex flex-col gap-4">
                    <Input
                      {...getInputProps(loginFields.email, {
                        type: "text",
                      })}
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
                      {isHydrated ? (
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
                  </div>

                  <input
                    {...getInputProps(loginFields.loginRedirect, {
                      type: "hidden",
                    })}
                    key="loginRedirect"
                  />
                  <div className="flex flex-col gap-2 items-center">
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
                    <Link
                      to={`/reset${
                        loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                      }`}
                      prefetch="intent"
                      className="text-primary font-bold underline text-base leading-5"
                    >
                      {locales.route.login.passwordForgotten}
                    </Link>
                  </div>
                </Form>
              )}

              <div className="flex flex-col gap-2 items-center">
                <p className="text-neutral-800 text-base leading-5 font-normal">
                  {locales.route.login.noMember}
                </p>
                <div className="flex gap-6">
                  <Link
                    to={`/register${
                      loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                    }`}
                    prefetch="intent"
                    className="text-primary font-bold underline text-base leading-5 text-nowrap"
                  >
                    {locales.route.login.registerByEmail}
                  </Link>
                  <Link
                    to={`/auth/keycloak${
                      loginRedirect ? `?login_redirect=${loginRedirect}` : ""
                    }`}
                    className="text-primary font-bold underline text-base leading-5 text-nowrap"
                  >
                    {locales.route.login.createMintId}
                  </Link>
                </div>
              </div>
              <a
                id="login-end"
                href="#login-start"
                className="absolute focus:relative w-0 h-0 opacity-0 focus:w-fit focus:h-fit focus:opacity-100 focus:px-1"
              >
                {locales.route.login.skip.end}
              </a>
            </div>
          </div>
        </div>
        <LoginSectionBobbel />
      </section>

      {/* Counter section */}
      <section className="flex w-full justify-center">
        <div className="w-full md:w-fit grid grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-4 md:gap-16 pt-11 md:pt-16 px-8 md:px-16.5 pb-6 md:pb-16">
          <div className="grid grid-cols-2 gap-4 md:gap-16">
            <div className="flex flex-col gap-2 p-4 items-center">
              <p className="text-primary text-5xl font-bold leading-10">
                {loaderData.profileCount}
              </p>
              <p className="text-primary text-lg font-semibold leading-5.5">
                {locales.route.counter.profiles}
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 items-center">
              <p className="text-primary text-5xl font-bold leading-10">
                {loaderData.organizationCount}
              </p>
              <p className="text-primary text-lg font-semibold leading-5.5">
                {locales.route.counter.organizations}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-16">
            <div className="flex flex-col gap-2 p-4 items-center">
              <p className="text-primary text-5xl font-bold leading-10">
                {loaderData.eventCount}
              </p>
              <p className="text-primary text-lg font-semibold leading-5.5">
                {locales.route.counter.events}
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 items-center">
              <p className="text-primary text-5xl font-bold leading-10">
                {loaderData.projectCount}
              </p>
              <p className="text-primary text-lg font-semibold leading-5.5">
                {locales.route.counter.projects}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event teaser section */}
      <section className="w-full flex flex-col gap-10 md:gap-6 px-4 md:px-10 xl:px-16 py-12 md:py-16 max-w-2xl mx-auto">
        <div className="w-full flex flex-col md:flex-row-reverse md:items-center md:justify-between gap-10">
          <div className="w-full md:h-110 rounded-2xl overflow-hidden">
            <Image
              src={eventSectionImage}
              blurredSrc={eventSectionBlurredImage}
              alt={locales.route.eventTeaser.image.alt}
            >
              <Image.Label withoutClassName>
                {loaderData.eventTeaserOrganization !== null ? (
                  <Link
                    to={`/organization/${loaderData.eventTeaserOrganization.slug}/detail/about`}
                    prefetch="intent"
                    className={`${getImageLabelClassName()}`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={mvLogo}
                        blurredSrc={mvLogoBlurred}
                        alt="MINTvernetzt"
                      />
                    </div>
                    <span className="text-white text-xs font-semibold leading-normal">
                      MINTvernetzt
                    </span>
                  </Link>
                ) : (
                  <div className={`${getImageLabelClassName()}`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={mvLogo}
                        blurredSrc={mvLogoBlurred}
                        alt="MINTvernetzt"
                      />
                    </div>
                    <span className="text-white text-xs font-semibold leading-normal">
                      MINTvernetzt
                    </span>
                  </div>
                )}
              </Image.Label>
              <Image.Credits
                credits={locales.route.eventTeaser.image.credits}
              />
            </Image>
          </div>
          <div className="w-full md:w-100 md:min-w-100 flex flex-col gap-10">
            <div className="w-full flex flex-col gap-6">
              <h2 className="mb-0 text-primary-600 text-5xl font-bold leading-9">
                {locales.route.eventTeaser.headline}
              </h2>
              <ul className="flex flex-col gap-4">
                {[
                  locales.route.eventTeaser.benefits.formats,
                  locales.route.eventTeaser.benefits.knowledge,
                  locales.route.eventTeaser.benefits.ownEvents,
                ].map((benefit) => {
                  return (
                    <li key={benefit} className="flex items-center gap-2">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
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
            </div>
            <div className="hidden md:block">
              <Button
                as="link"
                variant="outline"
                to="/explore/events"
                prefetch="intent"
              >
                {locales.route.eventTeaser.allEvents}
              </Button>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col gap-4">
          <h3 className="mb-0 text-primary-600 text-lg font-bold leading-6">
            {locales.route.eventTeaser.upcomingEvents.headline}
          </h3>
          {loaderData.upcomingEvents.length === 0 ? (
            <p>{locales.route.eventTeaser.upcomingEvents.empty}</p>
          ) : (
            <ul className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6">
              {loaderData.upcomingEvents.map((event, index) => {
                return (
                  <ListItemEvent
                    key={event.id}
                    index={index}
                    to={`/event/${event.slug}/detail/about`}
                  >
                    <ListItemEvent.Info
                      {...event}
                      stage={event.stage}
                      participantCount={
                        event._count.participants + event._count.guests
                      }
                      locales={{
                        stages: loaderData.locales.stages,
                        ...loaderData.locales.route.eventTeaser,
                      }}
                      language={loaderData.language}
                      shownInfos={{ stage: false, date: true, seats: false }}
                    ></ListItemEvent.Info>
                    <ListItemEvent.Headline>
                      {event.name}
                    </ListItemEvent.Headline>
                    {hasContent(event.subline) ||
                    hasContent(event.description) ? (
                      <ListItemEvent.Subline>
                        {hasContent(event.subline) ? (
                          event.subline
                        ) : hasContent(event.description) ? (
                          <RichText html={event.description} />
                        ) : null}
                      </ListItemEvent.Subline>
                    ) : (
                      <ListItemEvent.Subline>
                        <div className="hidden @md:block @md:h-5.25" />
                      </ListItemEvent.Subline>
                    )}
                  </ListItemEvent>
                );
              })}
            </ul>
          )}
          <div className="md:hidden">
            <Button
              as="link"
              variant="outline"
              to="/explore/events"
              prefetch="intent"
            >
              {locales.route.eventTeaser.allEvents}
            </Button>
          </div>
        </div>
      </section>

      {/* Funding section */}
      <section className="w-full px-4 md:px-10 xl:px-16 py-12 md:py-16 max-w-2xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-primary-400 p-6 md:p-10">
          <div className="flex flex-col gap-10 max-w-112 @2xl:max-w-180">
            <div className="flex flex-col gap-4">
              <h2 className="mb-0 text-5xl text-white font-bold leading-9">
                {locales.route.funding.headline}
              </h2>
              <p className="text-neutral-100 text-lg font-semibold leading-6">
                {locales.route.funding.info}
              </p>
            </div>
            <Button
              as="link"
              variant="outline"
              to="/explore/fundings"
              prefetch="intent"
            >
              {locales.route.funding.cta}
            </Button>
          </div>
          <FundingSectionBobbel />
        </div>
      </section>

      {/* Project teaser section */}
      <section className="w-full flex flex-col gap-10 md:gap-6 px-4 md:px-10 xl:px-16 py-12 md:py-16 max-w-2xl mx-auto">
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div className="w-full md:h-110 rounded-2xl overflow-hidden">
            <Image
              src={projectTeaserImage}
              blurredSrc={projectTeaserImageBlurred}
              alt={locales.route.projectTeaser.image.alt}
            >
              <Image.Label withoutClassName>
                {loaderData.projectTeaserOrganization ? (
                  <Link
                    to={`/organization/${loaderData.projectTeaserOrganization.slug}/detail/about`}
                    prefetch="intent"
                    className={`${getImageLabelClassName()}`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={tinkertankLogo}
                        blurredSrc={tinkertankLogoBlurred}
                        alt="Tinkertank"
                      />
                    </div>
                    <span className="text-white text-xs font-semibold leading-normal">
                      Tinkertank
                    </span>
                  </Link>
                ) : (
                  <div className={`${getImageLabelClassName()}`}>
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={tinkertankLogo}
                        blurredSrc={tinkertankLogoBlurred}
                        alt="Tinkertank"
                      />
                    </div>
                    <span className="text-white text-xs font-semibold leading-normal">
                      Tinkertank
                    </span>
                  </div>
                )}
              </Image.Label>
              <Image.Credits
                credits={locales.route.projectTeaser.image.credits}
              />
            </Image>
          </div>
          <div className="w-full md:w-100 md:min-w-100 flex flex-col gap-10">
            <div className="w-full flex flex-col gap-6">
              <h2 className="mb-0 text-primary-600 text-5xl font-bold leading-9">
                {locales.route.projectTeaser.headline}
              </h2>
              <ul className="flex flex-col gap-4">
                {[
                  locales.route.projectTeaser.benefits.ideas,
                  locales.route.projectTeaser.benefits.cooperations,
                  locales.route.projectTeaser.benefits.ownProjects,
                  locales.route.projectTeaser.benefits.learn,
                ].map((benefit) => {
                  return (
                    <li key={benefit} className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
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
            </div>
            <Button
              as="link"
              to="/explore/projects"
              variant="outline"
              prefetch="intent"
            >
              {locales.route.projectTeaser.allProjects}
            </Button>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="w-full flex flex-col gap-6 items-center py-12 md:py-16 max-w-2xl mx-auto">
        <h2 className="mb-0 text-primary-600 text-5xl font-bold leading-9">
          {locales.route.tools.headline}
        </h2>
        <ul
          className="w-full flex flex-nowrap items-stretch gap-6 md:gap-8 overflow-y-auto px-4 md:px-10 xl:px-16 py-4"
          ref={toolsSliderRef}
        >
          {toolsSectionData.map((tool) => {
            const toolLocales = locales.route.tools.items[tool.name];

            return (
              <li
                key={tool.name}
                className="flex flex-col min-w-83.5 md:min-w-120 w-83.5 md:w-120 rounded-2xl overflow-hidden border border-neutral-200 bg-white"
              >
                <div
                  className={`w-full h-66 ${typeof tool.bgClassName !== "undefined" ? ` ${tool.bgClassName}` : ""}`}
                >
                  <div
                    className={`w-full h-full${tool.name === "mediaDatabase" ? " rounded-lg overflow-hidden" : ""}`}
                  >
                    {tool.name === "fundings" ? (
                      <div className="w-full h-66 flex justify-center items-center">
                        <PiggyBank />
                      </div>
                    ) : (
                      <Image
                        src={tool.imagePath}
                        blurredSrc={tool.blurredImagePath}
                        alt={toolLocales.imgAlt}
                      />
                    )}
                  </div>
                </div>
                <div className="w-full h-full flex flex-col gap-4 justify-between p-6">
                  <div className="flex flex-col gap-4">
                    <h3 className="mb-0 text-primary-600 text-3xl font-bold leading-8">
                      {toolLocales.headline}
                    </h3>
                    <p className="text-neutral-700 text-base font-normal leading-5">
                      {toolLocales.content}
                    </p>
                  </div>
                  <Button
                    as="link"
                    variant="outline"
                    to={tool.link}
                    rel={tool.external ? "noopener noreferrer" : undefined}
                    target={tool.external ? "_blank" : undefined}
                    prefetch={tool.external ? "none" : "intent"}
                  >
                    {tool.external ? (
                      <span>
                        <External />
                      </span>
                    ) : null}
                    <span>{toolLocales.action}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-2">
          {/* TODO: Integrate this variant in SquareButton. Design used detached component. */}
          <button
            type="button"
            onClick={() => scrollToolsSlider("previous")}
            aria-label={locales.route.tools.slider.previous}
            className={`appearance-none font-semibold whitespace-nowrap flex items-center justify-center align-middle text-center rounded-lg p-2 h-10 w-10 min-w-10 text-sm leading-5 bg-white border-neutral-300 border ${scrollAmount <= 0 ? "pointer-events-none text-neutral-300" : "text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-1 focus:ring-primary-200 focus:outline-hidden focus:border-primary-200"}`}
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
            aria-label={locales.route.tools.slider.next}
            className={`appearance-none font-semibold whitespace-nowrap flex items-center justify-center align-middle text-center rounded-lg p-2 h-10 w-10 min-w-10 text-sm leading-5 border bg-white border-neutral-300 ${scrollAmount >= maxScroll ? "pointer-events-none text-neutral-300" : "text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-1 focus:ring-primary-200 focus:outline-hidden focus:border-primary-200"}`}
          >
            <Icon type="chevron-right" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Community Section */}
      <section className="w-full flex flex-col gap-10 md:gap-16 py-12 md:py-16 max-w-2xl mx-auto">
        <div className="w-full flex flex-col gap-10 px-4 md:px-10 xl:px-16">
          <div className="flex flex-col gap-6 max-w-166">
            <h2 className="mb-0 text-primary-600 text-6xl font-bold leading-11">
              {locales.route.community.headline}
            </h2>
            <p className="text-neutral-800 text-lg font-semibold leading-6">
              {locales.route.community.intro}
            </p>
          </div>
          <ul
            className="relative w-full rounded-2xl overflow-hidden h-111"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {communityImages.map((image, index) => {
              return (
                <li
                  key={image.src}
                  aria-hidden={index !== activeSlide}
                  className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "opacity-0 invisible"}`}
                >
                  <Image
                    src={image.src}
                    alt={locales.route.community.items[image.name].imgAlt}
                    gravity={image.gravity}
                  >
                    <Image.Credits
                      credits={locales.route.community.items[image.name].credit}
                    />
                  </Image>
                </li>
              );
            })}
            <div className="absolute bottom-4 left-4 md:right-4 flex justify-center">
              <div className="flex gap-2.5 p-1 rounded-lg bg-neutral-800/80">
                {communityImages.map((image, index) => {
                  return (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => onClick(index)}
                      aria-label={insertParametersIntoLocale(
                        locales.route.community.slideshow.showImage,
                        { number: index + 1, total: communityImages.length }
                      )}
                      aria-current={index === activeSlide}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === activeSlide ? "bg-primary-300" : "bg-neutral-200"}`}
                    />
                  );
                })}
              </div>
            </div>
          </ul>
        </div>

        {loaderData.testimonials.length > 0 ? (
          <div>
            <h2>{locales.route.testimonials.headline}</h2>
            <ul ref={testimonialListRef}>
              {loaderData.testimonials.map((testimonial) => {
                const cardContent = (
                  <>
                    <img src={testimonial.image} alt="" />
                    <p>{testimonial.quote[loaderData.language]}</p>
                    <p>{testimonial.name}</p>
                    <p>{testimonial.organization}</p>
                  </>
                );
                return (
                  <li key={testimonial.username}>
                    {testimonial.profileExists ? (
                      <Link
                        to={`/profile/${testimonial.username}`}
                        prefetch="intent"
                      >
                        {cardContent}
                      </Link>
                    ) : (
                      <div>{cardContent}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => scrollTestimonials("previous")}
              aria-label={locales.route.testimonials.controls.previous}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 4L6 8L10 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollTestimonials("next")}
              aria-label={locales.route.testimonials.controls.next}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : null}

        <div>
          <div aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 511 511"
              fill="none"
            >
              <path
                fill="#D0A9CD"
                d="M201.799 57.4368C237.555 48.0792 279.068 73.5963 285.952 76.3423C292.835 79.0883 366.328 113.382 405.626 143.78C454.749 181.778 431.366 235.014 385.562 350.393C339.757 465.772 293.626 448.717 148.36 374.864C-4.08188 297.363 66.3955 217.402 93.5953 169.696C120.795 121.99 166.044 66.7943 201.799 57.4368Z"
              />
              <path
                stroke="#BBD1FC"
                strokeWidth="2"
                d="M460.775 278.011C456.13 316.774 414.981 347.696 409.617 353.398C404.254 359.099 342.099 418.054 297.01 444.908C240.648 478.477 197.379 434.887 101.716 345.204C6.05168 255.521 40.6721 216.785 169.492 102.606C304.675 -17.2132 355.977 83.0075 392.334 128.208C428.69 173.408 465.42 239.247 460.775 278.011Z"
              />
            </svg>
          </div>
          <h2>{locales.route.communityCta.headline}</h2>
          <p>{locales.route.communityCta.intro}</p>
          <Button
            as="link"
            to="/next/get-involved"
            variant="outline"
            fullSize
            prefetch="intent"
          >
            {locales.route.communityCta.getInvolved}
          </Button>
        </div>
      </section>

      {/* About section */}
      <section>
        <div>
          <Image
            src="/images/mintvernetztteam.jpg"
            alt={locales.route.about.image.alt}
          >
            <Image.Label withoutClassName>
              <Link
                to={`/organization/mintvernetzt/detail/about`}
                prefetch="intent"
                className={`${getImageLabelClassName()}`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <Image
                    src={mvLogo}
                    blurredSrc={mvLogoBlurred}
                    alt="MINTvernetzt"
                  />
                </div>
                <span className="text-white text-xs font-semibold leading-normal">
                  MINTvernetzt
                </span>
              </Link>
            </Image.Label>
            {/* TODO: Credit from design needed. currently empty */}
            <Image.Credits credits={locales.route.about.image.credits} />
          </Image>
        </div>

        <h2>{locales.route.about.headline}</h2>
        <p>{locales.route.about.description}</p>
        <p>{locales.route.about.moreInformation}</p>
        <Button
          as="link"
          to="https://www.mint-vernetzt.de"
          target="_blank"
          rel="noreferrer noopener"
          variant="outline"
        >
          <Icon type="box-arrow-up-right" />
          {locales.route.about.website}
        </Button>
      </section>

      {/* FAQ section */}
      <section>
        <h2>{locales.route.faq.headline}</h2>
        <Accordion>
          <Accordion.Item id="whatIsStem" key="whatIsStem">
            {locales.route.faq.qAndAs.whatIsStem.question}
            <RichText
              id="faq-content"
              html={locales.route.faq.qAndAs.whatIsStem.answer}
            />
          </Accordion.Item>
          <Accordion.Item id="whoIsThePlatformFor" key="whoIsThePlatformFor">
            {locales.route.faq.qAndAs.whoIsThePlatformFor.question}
            <RichText
              id="faq-content"
              html={locales.route.faq.qAndAs.whoIsThePlatformFor.answer}
            />
          </Accordion.Item>
          <Accordion.Item
            id="benefitsOfThePlatform"
            key="benefitsOfThePlatform"
          >
            {locales.route.faq.qAndAs.benefitsOfThePlatform.question}
            <RichText
              id="faq-content"
              html={locales.route.faq.qAndAs.benefitsOfThePlatform.answer}
            />
          </Accordion.Item>
        </Accordion>
        {/* These two questions are only shown on mobile */}
        <Accordion>
          <Accordion.Item id="isItFree" key="isItFree">
            {locales.route.faq.qAndAs.isItFree.question}
            <RichText
              id="faq-content"
              html={locales.route.faq.qAndAs.isItFree.answer}
            />
          </Accordion.Item>
          <Accordion.Item
            id="benefitsOfRegistration"
            key="benefitsOfRegistration"
          >
            {locales.route.faq.qAndAs.benefitsOfRegistration.question}
            <RichText
              id="faq-content"
              html={locales.route.faq.qAndAs.benefitsOfRegistration.answer}
            />
          </Accordion.Item>
        </Accordion>
        <Accordion>
          <Accordion.Item id="mintId" key="mintId">
            {locales.route.faq.qAndAs.mintId.question}
            <RichText
              id="faq-content"
              html={locales.route.faq.qAndAs.mintId.answer}
            />
          </Accordion.Item>
        </Accordion>
        <Button as="link" to="/help" variant="outline" prefetch="intent">
          {locales.route.faq.cta}
        </Button>
      </section>
    </>
  );
}
