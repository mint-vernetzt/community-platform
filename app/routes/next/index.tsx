import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Image } from "@mint-vernetzt/components/src/molecules/Image";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { utcToZonedTime } from "date-fns-tz";
import { useRef, useEffect, useState } from "react";
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
import { Accordion } from "~/components-next/Accordion";
import { RichText } from "~/components/legacy/Richtext/RichText";
import { checkHoneypot } from "~/honeypot.server";
import { HONEYPOT_CLASSNAME } from "~/honeypot.shared";
import { detectLanguage } from "~/i18n.server";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { getDateDuration } from "~/lib/utils/time";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { isBotRequest } from "~/utils.server";
import { login } from "../login/index.server";
import { createLoginSchema } from "../login/index.shared";
import { getDataForToolsSection } from "../resources.server";
import {
  getEventCount,
  getOrganizationCount,
  getProfileCount,
  getProjectCount,
} from "../utils.server";
import {
  getEventTeaserOrganizationSlug,
  getProjectTeaserOrganizationSlug,
  getTestimonials,
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
  const testimonials = await getTestimonials();

  const toolsSectionData = getDataForToolsSection();

  const communityImages = [
    {
      src: "/images/landingpage_images/231121_Thinkaton_HF_1425_1.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/231121_Thinkaton_HF_1689.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/Designbasedlearning_Bbarth.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/Designbasedlearning_Bbarth_2.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/Jahrestagung_2025_Head_NMF.jpg",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/Lisa_Ihde.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/MINTvernetzt_Tag_01_Foto_andi_weiland_01.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/MINTvernetzt_Tag_01_Foto_andi_weiland_02.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/MINTVJT11022025.png",
      credit: "© Andi Weiland",
    },
    {
      src: "/images/landingpage_images/Yosa_Peit.png",
      credit: "© Andi Weiland",
    },
  ];

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
    testimonials,
    toolsSectionData,
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
  const { locales, communityImages, toolsSectionData } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const [urlSearchParams] = useSearchParams();

  const loginRedirect = urlSearchParams.get("login_redirect");

  const [activeSlide, setActiveSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

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
      {/* Header & Login section */}
      <section>
        <div>
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

        <h1>{locales.content.headline}</h1>
        <p>{locales.content.intro}</p>

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
        >
          {locales.login.moreInformation}
        </Link>
        <hr />
        <span>{locales.login.or}</span>
        {loaderData.isBot === false && (
          <Form {...getFormProps(loginForm)} method="post" autoComplete="off">
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
                    <Input.Error id={loginFields.email.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
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
                    <Input.Error id={loginFields.password.errorId} key={error}>
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
          </Form>
        )}
        <Link
          to={`/reset${
            loginRedirect ? `?login_redirect=${loginRedirect}` : ""
          }`}
          prefetch="intent"
        >
          {locales.login.passwordForgotten}
        </Link>
        <p>{locales.login.noMember}</p>
        <Link
          to={`/register${
            loginRedirect ? `?login_redirect=${loginRedirect}` : ""
          }`}

          prefetch="intent"
        >
          {locales.login.registerByEmail}
        </Link>
        <Link
          to={`/auth/keycloak${
            loginRedirect ? `?login_redirect=${loginRedirect}` : ""
          }`}
        >
          {locales.login.createMintId}
        </Link>
        <a
          id="login-end"
          href="#login-start"
          className="w-0 h-0 opacity-0 focus:w-fit focus:h-fit focus:opacity-100 focus:px-1"
        >
          {locales.login.skip.end}
        </a>
      </section>

      {/* Counter section */}
      <section>
        <div>
          <p>{loaderData.profileCount}</p>
          <p>{locales.counter.profiles}</p>
        </div>
        <div>
          <p>{loaderData.organizationCount}</p>
          <p>{locales.counter.organizations}</p>
        </div>
        <div>
          <p>{loaderData.eventCount}</p>
          <p>{locales.counter.events}</p>
        </div>
        <div>
          <p>{loaderData.projectCount}</p>
          <p>{locales.counter.projects}</p>
        </div>
      </section>

      {/* Event teaser section */}
      <section>
        <h2>{locales.eventTeaser.headline}</h2>
        <ul>
          {[
            locales.eventTeaser.benefits.formats,
            locales.eventTeaser.benefits.knowledge,
            locales.eventTeaser.benefits.ownEvents,
          ].map((benefit) => {
            return (
              <li key={benefit}>
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
        <Button
          as="link"
          to="/explore/events"
          variant="outline"
          prefetch="intent"
        >
          {locales.eventTeaser.allEvents}
        </Button>

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
          >
            <img src="/images/mint-vernetzt_shortlogo.png" alt="" />
            <span>MINTvernetzt</span>
          </Link>
        ) : (
          <div>
            <img src="/images/mint-vernetzt_shortlogo.png" alt="" />
            <span>MINTvernetzt</span>
          </div>
        )}

        <h3>{locales.eventTeaser.upcomingEvents.headline}</h3>
        {loaderData.upcomingEvents.length === 0 ? (
          <p>{locales.eventTeaser.upcomingEvents.empty}</p>
        ) : (
          <ul>
            {loaderData.upcomingEvents.map((event) => {
              const startTime = utcToZonedTime(
                event.startTime,
                "Europe/Berlin"
              );
              const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");
              return (
                <li key={event.slug}>
                  <Link
                    to={`/event/${event.slug}/detail/about`}
                    prefetch="intent"
                  >
                    <p>
                      {getDateDuration(startTime, endTime, loaderData.language)}
                    </p>
                    <p>{event.name}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Funding section */}
      <section>
        <img src="/images/bubble-grafik-blau.svg" alt="" />

        <h2>{locales.funding.headline}</h2>
        <p>{locales.funding.info}</p>
        <Link
          to="/explore/fundings"

          prefetch="intent"
        >
          {locales.funding.cta}
        </Link>
      </section>

      {/* Project teaser section */}
      <section>
        <Image
          src="/images/jasminmertikat.jpg"
          alt={locales.projectTeaser.image.alt}
        >
          <Image.Credits credits={locales.projectTeaser.image.credits} />
        </Image>
        {loaderData.projectTeaserOrganizationSlug !== null ? (
          <Link
            to={`/organization/${loaderData.projectTeaserOrganizationSlug}/detail/about`}
            prefetch="intent"
          >
            <img src="/images/tinkertank_shortlogo.jpg" alt="" />
            <span>Tinkertank</span>
          </Link>
        ) : (
          <div>
            <img src="/images/tinkertank_shortlogo.jpg" alt="" />
            <span>Tinkertank</span>
          </div>
        )}

        <h2>{locales.projectTeaser.headline}</h2>
        <ul>
          {[
            locales.projectTeaser.benefits.ideas,
            locales.projectTeaser.benefits.cooperations,
            locales.projectTeaser.benefits.ownProjects,
            locales.projectTeaser.benefits.learn,
          ].map((benefit) => {
            return (
              <li key={benefit}>
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
        <Button
          as="link"
          to="/explore/projects"
          variant="outline"
          prefetch="intent"
        >
          {locales.projectTeaser.allProjects}
        </Button>
      </section>

      {/* Tools Section */}
      <section>
        <h2>{locales.tools.headline}</h2>
        <div ref={toolsSliderRef}>
          {toolKeys.map((toolKey) => {
            const tool = toolsSectionData[toolKey];
            const toolLocales = locales.tools[toolKey];

            return (
              <div key={toolKey}>
                <Image
                  src={tool.imagePath}
                  blurredSrc={tool.blurredImagePath}
                  alt={toolLocales.imgAlt}
                />
                <h3>{toolLocales.headline}</h3>
                {tool.beta ? <BetaTag /> : null}
                <p>{toolLocales.content}</p>
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
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => scrollToolsSlider("previous")}
          aria-label={locales.tools.slider.previous}
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
        >
          <Icon type="chevron-right" aria-hidden="true" />
        </button>
      </section>

      {/* Community Section */}
      <section>
        <h2>{locales.community.headline}</h2>
        <p>{locales.community.intro}</p>
        <ul>
          {communityImages.map((image, index) => {
            return (
              <li key={image.src} aria-hidden={index !== activeSlide}>
                <Image
                  src={image.src}
                  alt={locales.community.slideshow.imageAlt}
                  disableFadeIn
                />
                {typeof image.credit !== "undefined" && image.credit !== "" ? (
                  <>
                    <div>{image.credit}</div>
                    <div>{image.credit}</div>
                  </>
                ) : null}
              </li>
            );
          })}
          <div>
            {communityImages.map((image, index) => {
              return (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => {
                    setActiveSlide(index);
                    setAutoPlay(false);
                  }}
                  aria-label={insertParametersIntoLocale(
                    locales.community.slideshow.showImage,
                    { number: index + 1, total: communityImages.length }
                  )}
                  aria-current={index === activeSlide}
                />
              );
            })}
          </div>
        </ul>
      </section>

      {/* Testimonials Section */}
      {loaderData.testimonials.length > 0 ? (
        <section>
          <h2>{locales.testimonials.headline}</h2>
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
            aria-label={locales.testimonials.controls.previous}
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
            aria-label={locales.testimonials.controls.next}
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
        </section>
      ) : null}

      {/* Roadmap teaser section */}
      <section>
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
        <h2>{locales.communityCta.headline}</h2>
        <p>{locales.communityCta.intro}</p>
        <Button
          as="link"
          to="/next/get-involved"
          variant="outline"
          fullSize
          prefetch="intent"
        >
          {locales.communityCta.getInvolved}
        </Button>
      </section>

      {/* About section */}
      <section>
        <div>
          <Image
            src="/images/mintvernetztteam.jpg"
            alt={locales.about.image.alt}
          >
            {locales.about.image.credits !== "" ? (
              <Image.Credits credits={locales.about.image.credits} />
            ) : null}
          </Image>
        </div>
        {loaderData.eventTeaserOrganizationSlug !== null ? (
          <Link
            to={`/organization/${loaderData.eventTeaserOrganizationSlug}/detail/about`}
            prefetch="intent"
          >
            <img src="/images/mint-vernetzt_shortlogo.png" alt="" />
            <span>MINTvernetzt</span>
          </Link>
        ) : (
          <div>
            <img src="/images/mint-vernetzt_shortlogo.png" alt="" />
            <span>MINTvernetzt</span>
          </div>
        )}

        <h2>{locales.about.headline}</h2>
        <p>{locales.about.description}</p>
        <p>{locales.about.moreInformation}</p>
        <Button
          as="link"
          to="https://www.mint-vernetzt.de"
          target="_blank"
          rel="noreferrer noopener"
          variant="outline"
        >
          <Icon type="box-arrow-up-right" />
          {locales.about.website}
        </Button>
      </section>

      {/* FAQ section */}
      <section>
        <h2>{locales.faq.headline}</h2>
        <Accordion>
          <Accordion.Item id="whatIsStem" key="whatIsStem">
            {locales.faq.qAndAs.whatIsStem.question}
            <RichText
              id="faq-content"
              html={locales.faq.qAndAs.whatIsStem.answer}
            />
          </Accordion.Item>
          <Accordion.Item id="whoIsThePlatformFor" key="whoIsThePlatformFor">
            {locales.faq.qAndAs.whoIsThePlatformFor.question}
            <RichText
              id="faq-content"
              html={locales.faq.qAndAs.whoIsThePlatformFor.answer}
            />
          </Accordion.Item>
          <Accordion.Item
            id="benefitsOfThePlatform"
            key="benefitsOfThePlatform"
          >
            {locales.faq.qAndAs.benefitsOfThePlatform.question}
            <RichText
              id="faq-content"
              html={locales.faq.qAndAs.benefitsOfThePlatform.answer}
            />
          </Accordion.Item>
        </Accordion>
        {/* These two questions are only shown on mobile */}
        <Accordion>
          <Accordion.Item id="isItFree" key="isItFree">
            {locales.faq.qAndAs.isItFree.question}
            <RichText
              id="faq-content"
              html={locales.faq.qAndAs.isItFree.answer}
            />
          </Accordion.Item>
          <Accordion.Item
            id="benefitsOfRegistration"
            key="benefitsOfRegistration"
          >
            {locales.faq.qAndAs.benefitsOfRegistration.question}
            <RichText
              id="faq-content"
              html={locales.faq.qAndAs.benefitsOfRegistration.answer}
            />
          </Accordion.Item>
        </Accordion>
        <Accordion>
          <Accordion.Item id="mintId" key="mintId">
            {locales.faq.qAndAs.mintId.question}
            <RichText
              id="faq-content"
              html={locales.faq.qAndAs.mintId.answer}
            />
          </Accordion.Item>
        </Accordion>
        <Button as="link" to="/help" variant="outline" prefetch="intent">
          {locales.faq.cta}
        </Button>
      </section>
    </>
  );
}
