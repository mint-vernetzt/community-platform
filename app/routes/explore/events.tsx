import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { EventCard } from "@mint-vernetzt/components/src/organisms/cards/EventCard";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { utcToZonedTime } from "date-fns-tz";
import type { LoaderFunctionArgs } from "react-router";
import {
  Form,
  redirect,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { ConformForm } from "~/components-next/ConformForm";
import { Dropdown } from "~/components-next/Dropdown";
import { Filters, ShowFiltersButton } from "~/components-next/Filters";
import { FormControl } from "~/components-next/FormControl";
import {
  HiddenFilterInputs,
  HiddenFilterInputsInContext,
} from "~/components-next/HiddenFilterInputs";
import { detectLanguage } from "~/i18n.server";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import { languageModuleMap } from "~/locales/.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { type FilterSchemes, getFilterSchemes } from "./all.shared";
import {
  enhanceEventsWithParticipationStatus,
  getAllEventTargetGroups,
  getAllEvents,
  getAllFocuses,
  getAllStages,
  getEventFilterVectorForAttribute,
  getEventIds,
  getFilterCountForSlug,
  getTakeParam,
} from "./events.server";
import { EVENT_SORT_VALUES, PERIOD_OF_TIME_VALUES } from "./events.shared";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const showFiltersValue = searchParams.getAll("showFilters");

  if (showFiltersValue.length > 1) {
    const cleanURL = new URL(request.url);
    cleanURL.searchParams.delete("showFilters");
    cleanURL.searchParams.append("showFilters", "on");
    return redirect(cleanURL.toString(), { status: 301 });
  }

  const submission = parseWithZod(searchParams, {
    schema: getFilterSchemes,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["explore/events"];

  const take = getTakeParam(submission.value.evtPage);
  const { authClient } = createAuthClient(request);

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn) {
    const eventIdsFilteredByVisibility = await getEventIds({
      filter: submission.value.evtFilter,
      search: submission.value.search,
      isLoggedIn,
      language,
    });
    filteredByVisibilityCount = eventIdsFilteredByVisibility.length;
  }

  const eventIds = await getEventIds({
    filter: submission.value.evtFilter,
    search: submission.value.search,
    isLoggedIn: true,
    language,
  });

  const eventsCount = eventIds.length;

  const events = await getAllEvents({
    filter: submission.value.evtFilter,
    sortBy: submission.value.evtSortBy,
    search: submission.value.search,
    sessionUser,
    take,
    language,
  });

  const enhancedEvents = [];
  for (const event of events) {
    let enhancedEvent = {
      ...event,
    };

    // Filtering by visbility settings
    if (sessionUser === null) {
      // Filter event
      type EnhancedEvent = typeof enhancedEvent;
      enhancedEvent = filterEventByVisibility<EnhancedEvent>(enhancedEvent);
      // Filter responsible Organizations
      enhancedEvent.responsibleOrganizations =
        enhancedEvent.responsibleOrganizations.map((relation) => {
          type OrganizationRelation = typeof relation.organization;
          const filteredOrganization =
            filterOrganizationByVisibility<OrganizationRelation>(
              relation.organization
            );
          return { ...relation, organization: filteredOrganization };
        });
    }

    // Add images from image proxy
    let background = enhancedEvent.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.Card.Background.width,
            height: ImageSizes.Event.Card.Background.height,
          },
        });
      }
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.Card.BlurredBackground.width,
          height: ImageSizes.Event.Card.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }

    const responsibleOrganizations = enhancedEvent.responsibleOrganizations.map(
      (relation) => {
        let logo = relation.organization.logo;
        let blurredLogo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Organization.CardFooter.Logo.width,
                height: ImageSizes.Organization.CardFooter.Logo.height,
              },
            });
            blurredLogo = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Organization.CardFooter.BlurredLogo.width,
                height: ImageSizes.Organization.CardFooter.BlurredLogo.height,
              },
              blur: BlurFactor,
            });
          }
        }
        return {
          ...relation,
          organization: { ...relation.organization, logo, blurredLogo },
        };
      }
    );

    const imageEnhancedEvent = {
      ...enhancedEvent,
      background,
      blurredBackground,
      responsibleOrganizations,
    };

    enhancedEvents.push(imageEnhancedEvent);
  }

  const enhancedEventsWithParticipationStatus =
    await enhanceEventsWithParticipationStatus(sessionUser, enhancedEvents);

  const areas = await getAreasBySearchQuery(submission.value.evtAreaSearch);
  type EnhancedAreas = Array<
    ArrayElement<Awaited<ReturnType<typeof getAreasBySearchQuery>>> & {
      vectorCount: ReturnType<typeof getFilterCountForSlug>;
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };

  const areaEventIds =
    submission.value.search.length > 0
      ? await getEventIds({
          filter: { ...submission.value.evtFilter, area: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : eventIds;
  const areaFilterVector = await getEventFilterVectorForAttribute({
    attribute: "area",
    filter: submission.value.evtFilter,
    search: submission.value.search,
    ids: areaEventIds,
  });

  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(
      area.slug,
      areaFilterVector,
      "area"
    );
    const enhancedArea = {
      ...area,
      vectorCount,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  const selectedAreas = await Promise.all(
    submission.value.evtFilter.area.map(async (slug) => {
      const vectorCount = getFilterCountForSlug(slug, areaFilterVector, "area");
      const isInSearchResultsList = areas.some((area) => {
        return area.slug === slug;
      });
      return {
        slug,
        name: (await getAreaNameBySlug(slug)) || null,
        vectorCount,
        isInSearchResultsList,
      };
    })
  );

  const focuses = await getAllFocuses();
  const focusEventIds =
    submission.value.search.length > 0
      ? await getEventIds({
          filter: { ...submission.value.evtFilter, focus: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : eventIds;
  const focusFilterVector = await getEventFilterVectorForAttribute({
    attribute: "focus",
    filter: submission.value.evtFilter,
    search: submission.value.search,
    ids: focusEventIds,
  });
  const enhancedFocuses = focuses.map((focus) => {
    const vectorCount = getFilterCountForSlug(
      focus.slug,
      focusFilterVector,
      "focus"
    );
    return { ...focus, vectorCount };
  });

  const targetGroups = await getAllEventTargetGroups();
  const targetGroupEventIds =
    submission.value.search.length > 0
      ? await getEventIds({
          filter: { ...submission.value.evtFilter, eventTargetGroup: [] },
          search: submission.value.search,
          isLoggedIn: true,
          language,
        })
      : eventIds;
  const targetGroupFilterVector = await getEventFilterVectorForAttribute({
    attribute: "eventTargetGroup",
    filter: submission.value.evtFilter,
    search: submission.value.search,
    ids: targetGroupEventIds,
  });
  const enhancedTargetGroups = targetGroups.map((targetGroup) => {
    const vectorCount = getFilterCountForSlug(
      targetGroup.slug,
      targetGroupFilterVector,
      "eventTargetGroup"
    );
    return { ...targetGroup, vectorCount };
  });

  const stagesFromDB = await getAllStages();
  const stages = (
    [
      {
        id: "0",
        slug: "all",
      },
    ] as typeof stagesFromDB
  ).concat(stagesFromDB);
  const enhancedStages = stages.map((stage) => {
    return { ...stage };
  });

  return {
    isLoggedIn,
    events: enhancedEventsWithParticipationStatus,
    areas: enhancedAreas,
    selectedAreas,
    focuses: enhancedFocuses,
    selectedFocuses: submission.value.evtFilter.focus,
    targetGroups: enhancedTargetGroups,
    stages: enhancedStages,
    selectedTargetGroups: submission.value.evtFilter.eventTargetGroup,
    submission,
    filteredByVisibilityCount,
    eventsCount,
    locales,
    language,
  };
};

export default function ExploreEvents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isHydrated = useHydrated();

  const [form, fields] = useForm<FilterSchemes>({
    id: "filter-events",
    defaultValue: {
      ...loaderData.submission.value,
      showFilters: "on",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const evtFilterFieldset = fields.evtFilter.getFieldset();

  const [loadMoreForm, loadMoreFields] = useForm<FilterSchemes>({
    id: "load-more-events",
    defaultValue: {
      ...loaderData.submission.value,
      evtPage: loaderData.submission.value.evtPage + 1,
      showFilters: "",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const [resetForm, resetFields] = useForm<FilterSchemes>({
    id: "reset-event-filters",
    defaultValue: {
      ...loaderData.submission.value,
      evtFilter: {
        area: [],
        eventTargetGroup: [],
        focus: [],
        periodOfTime: PERIOD_OF_TIME_VALUES[0],
        stage: "all",
      },
      evtPage: 1,
      evtSortBy: EVENT_SORT_VALUES[0],
      evtAreaSearch: "",
      showFilters: "",
    },
    constraint: getZodConstraint(getFilterSchemes),
    lastResult: navigation.state === "idle" ? loaderData.submission : null,
  });

  const currentSortValue = EVENT_SORT_VALUES.find((value) => {
    return value === `${loaderData.submission.value.evtSortBy}`;
  });

  let showMore = false;
  if (typeof loaderData.filteredByVisibilityCount !== "undefined") {
    showMore = loaderData.filteredByVisibilityCount > loaderData.events.length;
  } else {
    showMore = loaderData.eventsCount > loaderData.events.length;
  }

  return (
    <>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            let preventScrollReset = true;
            if (
              (event.target as HTMLFormElement).name === fields.showFilters.name
            ) {
              preventScrollReset = false;
            }
            submit(event.currentTarget, { preventScrollReset, method: "get" });
          }}
        >
          <HiddenFilterInputs
            fields={fields}
            defaultValue={loaderData.submission.value}
            entityLeftOut="event"
          />

          {/* Event Filters */}
          <input {...getInputProps(fields.evtPage, { type: "hidden" })} />
          <ShowFiltersButton>
            {locales.route.filter.showFiltersLabel}
          </ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>{locales.route.filter.title}</Filters.Title>
            <Filters.Fieldset
              className="mv-flex mv-flex-wrap @lg:mv-gap-4"
              {...getFieldsetProps(fields.evtFilter)}
              showMore={locales.route.filter.showMore}
              showLess={locales.route.filter.showLess}
            >
              <Dropdown>
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {locales.route.filter.stage}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {(() => {
                      let title;
                      if (
                        loaderData.submission.value.evtFilter.stage in
                        locales.stages
                      ) {
                        type LocaleKey = keyof typeof locales.stages;
                        title =
                          locales.stages[
                            loaderData.submission.value.evtFilter
                              .stage as LocaleKey
                          ].title;
                      } else {
                        console.error(
                          `Event stage ${loaderData.submission.value.evtFilter.stage} not found in locales`
                        );
                        title = loaderData.submission.value.evtFilter.stage;
                      }
                      return title;
                    })()}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.stages.map((stage) => {
                    const isChecked =
                      evtFilterFieldset.stage.initialValue &&
                      Array.isArray(evtFilterFieldset.stage.initialValue)
                        ? evtFilterFieldset.stage.initialValue.includes(
                            stage.slug
                          )
                        : evtFilterFieldset.stage.initialValue === stage.slug;
                    return (
                      <FormControl
                        {...getInputProps(evtFilterFieldset.stage, {
                          type: "radio",
                          value: stage.slug,
                        })}
                        key={stage.slug}
                        defaultChecked={isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            let description;
                            if (stage.slug in locales.stages) {
                              type LocaleKey = keyof typeof locales.stages;
                              title =
                                locales.stages[stage.slug as LocaleKey].title;
                              description =
                                locales.stages[stage.slug as LocaleKey]
                                  .description;
                            } else {
                              console.error(
                                `Event stage ${stage.slug} not found in locales`
                              );
                              title = stage.slug;
                              description = null;
                            }
                            return (
                              <>
                                {title}
                                {description !== null ? (
                                  <p className="mv-text-sm">{description}</p>
                                ) : null}
                              </>
                            );
                          })()}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.focuses}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedFocuses
                      .map((focus) => {
                        let title;
                        if (focus in locales.focuses) {
                          type LocaleKey = keyof typeof locales.focuses;
                          title = locales.focuses[focus as LocaleKey].title;
                        } else {
                          console.error(`Focus ${focus} not found in locales`);
                          title = focus;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.focuses.map((focus) => {
                    const isChecked =
                      evtFilterFieldset.focus.initialValue &&
                      Array.isArray(evtFilterFieldset.focus.initialValue)
                        ? evtFilterFieldset.focus.initialValue.includes(
                            focus.slug
                          )
                        : evtFilterFieldset.focus.initialValue === focus.slug;
                    return (
                      <FormControl
                        {...getInputProps(evtFilterFieldset.focus, {
                          type: "checkbox",
                          value: focus.slug,
                        })}
                        key={focus.slug}
                        defaultChecked={isChecked}
                        readOnly
                        disabled={focus.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            let description;
                            if (focus.slug in locales.focuses) {
                              type LocaleKey = keyof typeof locales.focuses;
                              title =
                                locales.focuses[focus.slug as LocaleKey].title;
                              description =
                                locales.focuses[focus.slug as LocaleKey]
                                  .description;
                            } else {
                              console.error(
                                `Event focus ${focus.slug} not found in locales`
                              );
                              title = focus.slug;
                              description = null;
                            }
                            return (
                              <>
                                {title}
                                {description !== null ? (
                                  <p className="mv-text-sm">{description}</p>
                                ) : null}
                              </>
                            );
                          })()}
                        </FormControl.Label>
                        <FormControl.Counter>
                          {focus.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {locales.route.filter.periodOfTime.label}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {
                      locales.route.filter.periodOfTime.values[
                        loaderData.submission.value.evtFilter.periodOfTime
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {PERIOD_OF_TIME_VALUES.map((periodOfTimeValue) => {
                    const isChecked =
                      evtFilterFieldset.periodOfTime.initialValue &&
                      Array.isArray(evtFilterFieldset.periodOfTime.initialValue)
                        ? evtFilterFieldset.periodOfTime.initialValue.includes(
                            periodOfTimeValue
                          )
                        : evtFilterFieldset.periodOfTime.initialValue ===
                          periodOfTimeValue;
                    return (
                      <FormControl
                        {...getInputProps(evtFilterFieldset.periodOfTime, {
                          type: "radio",
                          value: periodOfTimeValue,
                        })}
                        key={periodOfTimeValue}
                        defaultChecked={isChecked}
                      >
                        <FormControl.Label>
                          {
                            locales.route.filter.periodOfTime.values[
                              periodOfTimeValue
                            ]
                          }
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.targetGroups}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedTargetGroups
                      .map((targetGroup) => {
                        let title;
                        if (targetGroup in locales.eventTargetGroups) {
                          type LocaleKey =
                            keyof typeof locales.eventTargetGroups;
                          title =
                            locales.eventTargetGroups[targetGroup as LocaleKey]
                              .title;
                        } else {
                          console.error(
                            `Event target group ${targetGroup} not found in locales`
                          );
                          title = targetGroup;
                        }
                        return title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.targetGroups.map((targetGroup) => {
                    const isChecked =
                      evtFilterFieldset.eventTargetGroup.initialValue &&
                      Array.isArray(
                        evtFilterFieldset.eventTargetGroup.initialValue
                      )
                        ? evtFilterFieldset.eventTargetGroup.initialValue.includes(
                            targetGroup.slug
                          )
                        : evtFilterFieldset.eventTargetGroup.initialValue ===
                          targetGroup.slug;
                    return (
                      <FormControl
                        {...getInputProps(evtFilterFieldset.eventTargetGroup, {
                          type: "checkbox",
                          value: targetGroup.slug,
                        })}
                        key={targetGroup.slug}
                        defaultChecked={isChecked}
                        disabled={targetGroup.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>
                          {(() => {
                            let title;
                            let description;
                            if (targetGroup.slug in locales.eventTargetGroups) {
                              type LocaleKey =
                                keyof typeof locales.eventTargetGroups;
                              title =
                                locales.eventTargetGroups[
                                  targetGroup.slug as LocaleKey
                                ].title;
                              description =
                                locales.eventTargetGroups[
                                  targetGroup.slug as LocaleKey
                                ].description;
                            } else {
                              console.error(
                                `Event target group ${targetGroup.slug} not found in locales`
                              );
                              title = targetGroup.slug;
                              description = null;
                            }
                            return (
                              <>
                                {title}
                                {description !== null ? (
                                  <p className="mv-text-sm">{description}</p>
                                ) : null}
                              </>
                            );
                          })()}
                        </FormControl.Label>
                        <FormControl.Counter>
                          {targetGroup.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>

              <Dropdown>
                <Dropdown.Label>
                  {locales.route.filter.areas}
                  <span className="mv-font-normal @lg:mv-hidden">
                    <br />
                    {loaderData.selectedAreas
                      .map((area) => {
                        return area.name;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.areas.global.map((area) => {
                    const isChecked =
                      evtFilterFieldset.area.initialValue &&
                      Array.isArray(evtFilterFieldset.area.initialValue)
                        ? evtFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : evtFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(evtFilterFieldset.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={isChecked}
                        disabled={area.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {loaderData.areas.country.map((area) => {
                    const isChecked =
                      evtFilterFieldset.area.initialValue &&
                      Array.isArray(evtFilterFieldset.area.initialValue)
                        ? evtFilterFieldset.area.initialValue.includes(
                            area.slug
                          )
                        : evtFilterFieldset.area.initialValue === area.slug;
                    return (
                      <FormControl
                        {...getInputProps(evtFilterFieldset.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={isChecked}
                        disabled={area.vectorCount === 0 && !isChecked}
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {loaderData.selectedAreas.length > 0 &&
                    loaderData.selectedAreas.map((selectedArea) => {
                      return selectedArea.name !== null &&
                        selectedArea.isInSearchResultsList === false ? (
                        <FormControl
                          {...getInputProps(evtFilterFieldset.area, {
                            type: "checkbox",
                            value: selectedArea.slug,
                          })}
                          key={selectedArea.slug}
                          defaultChecked={true}
                        >
                          <FormControl.Label>
                            {selectedArea.name}
                          </FormControl.Label>
                          <FormControl.Counter>
                            {selectedArea.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      ) : null;
                    })}
                  <div className="mv-ml-4 mv-mr-2 mv-my-2">
                    <Input
                      {...getInputProps(fields.evtAreaSearch, {
                        type: "search",
                      })}
                      key="event-area-search"
                      placeholder={locales.route.filter.searchAreaPlaceholder}
                    >
                      <Input.Label htmlFor={fields.evtAreaSearch.id} hidden>
                        {locales.route.filter.searchAreaPlaceholder}
                      </Input.Label>
                      <Input.HelperText>
                        {locales.route.filter.searchAreaHelper}
                      </Input.HelperText>
                      <Input.Controls>
                        <noscript>
                          <Button>
                            {locales.route.filter.searchAreaButton}
                          </Button>
                        </noscript>
                      </Input.Controls>
                    </Input>
                  </div>
                  {loaderData.areas.state.length > 0 && (
                    <Dropdown.Legend>
                      {locales.route.filter.stateLabel}
                    </Dropdown.Legend>
                  )}
                  {loaderData.areas.state.length > 0 &&
                    loaderData.areas.state.map((area) => {
                      const isChecked =
                        evtFilterFieldset.area.initialValue &&
                        Array.isArray(evtFilterFieldset.area.initialValue)
                          ? evtFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : evtFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(evtFilterFieldset.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          defaultChecked={isChecked}
                          disabled={area.vectorCount === 0 && !isChecked}
                        >
                          <FormControl.Label>{area.name}</FormControl.Label>
                          <FormControl.Counter>
                            {area.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      );
                    })}
                  {loaderData.areas.state.length > 0 &&
                    loaderData.areas.district.length > 0 && (
                      <Dropdown.Divider />
                    )}
                  {loaderData.areas.district.length > 0 && (
                    <Dropdown.Legend>
                      {locales.route.filter.districtLabel}
                    </Dropdown.Legend>
                  )}
                  {loaderData.areas.district.length > 0 &&
                    loaderData.areas.district.map((area) => {
                      const isChecked =
                        evtFilterFieldset.area.initialValue &&
                        Array.isArray(evtFilterFieldset.area.initialValue)
                          ? evtFilterFieldset.area.initialValue.includes(
                              area.slug
                            )
                          : evtFilterFieldset.area.initialValue === area.slug;
                      return (
                        <FormControl
                          {...getInputProps(evtFilterFieldset.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          defaultChecked={isChecked}
                          disabled={area.vectorCount === 0 && !isChecked}
                        >
                          <FormControl.Label>{area.name}</FormControl.Label>
                          <FormControl.Counter>
                            {area.vectorCount}
                          </FormControl.Counter>
                        </FormControl>
                      );
                    })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.Fieldset {...getFieldsetProps(fields.evtSortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:mv-hidden">
                    {locales.route.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="mv-font-normal @lg:mv-font-semibold">
                    {
                      loaderData.locales.route.filter.sortBy.values[
                        currentSortValue || EVENT_SORT_VALUES[0]
                      ]
                    }
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {EVENT_SORT_VALUES.map((sortValue) => {
                    return (
                      <FormControl
                        {...getInputProps(fields.evtSortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        key={sortValue}
                        defaultChecked={currentSortValue === sortValue}
                      >
                        <FormControl.Label>
                          {locales.route.filter.sortBy.values[sortValue]}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton form={resetForm.id}>
              {isHydrated
                ? locales.route.filter.reset
                : locales.route.filter.close}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {isHydrated
                ? decideBetweenSingularOrPlural(
                    insertParametersIntoLocale(
                      locales.route.showNumberOfItems_one,
                      {
                        count: loaderData.eventsCount,
                      }
                    ),
                    insertParametersIntoLocale(
                      locales.route.showNumberOfItems_other,
                      {
                        count: loaderData.eventsCount,
                      }
                    ),
                    loaderData.eventsCount
                  )
                : locales.route.filter.apply}
            </Filters.ApplyButton>
          </Filters>
          <noscript className="mv-hidden @lg:mv-block mv-mt-2">
            <Button>{locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-4">
        <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
      </div>
      <section className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl mv-mb-6">
        {(loaderData.selectedFocuses.length > 0 ||
          loaderData.selectedTargetGroups.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="mv-flex mv-flex-col mv-gap-2">
            <div className="mv-overflow-auto mv-flex mv-flex-nowrap @lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-2">
              {loaderData.selectedFocuses.map((selectedFocus) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  evtFilterFieldset.focus.name,
                  selectedFocus
                );
                let title;
                if (selectedFocus in locales.focuses) {
                  type LocaleKey = keyof typeof locales.focuses;
                  title = locales.focuses[selectedFocus as LocaleKey].title;
                } else {
                  console.error(`Focus ${selectedFocus} not found in locales`);
                  title = selectedFocus;
                }
                return (
                  <ConformForm
                    key={selectedFocus}
                    useFormOptions={{
                      id: `delete-filter-${selectedFocus}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        evtFilter: {
                          ...loaderData.submission.value.evtFilter,
                          focus:
                            loaderData.submission.value.evtFilter.focus.filter(
                              (focus) => focus !== selectedFocus
                            ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {title}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                );
              })}
              {loaderData.selectedTargetGroups.map((selectedTargetGroup) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  evtFilterFieldset.eventTargetGroup.name,
                  selectedTargetGroup
                );
                let title;
                if (selectedTargetGroup in locales.eventTargetGroups) {
                  type LocaleKey = keyof typeof locales.eventTargetGroups;
                  title =
                    locales.eventTargetGroups[selectedTargetGroup as LocaleKey]
                      .title;
                } else {
                  console.error(
                    `Focus ${selectedTargetGroup} not found in locales`
                  );
                  title = selectedTargetGroup;
                }
                return (
                  <ConformForm
                    key={selectedTargetGroup}
                    useFormOptions={{
                      id: `delete-filter-${selectedTargetGroup}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        evtFilter: {
                          ...loaderData.submission.value.evtFilter,
                          eventTargetGroup:
                            loaderData.submission.value.evtFilter.eventTargetGroup.filter(
                              (eventTargetGroup) =>
                                eventTargetGroup !== selectedTargetGroup
                            ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {title}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                );
              })}
              {loaderData.selectedAreas.map((selectedArea) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  evtFilterFieldset.area.name,
                  selectedArea.slug
                );
                return selectedArea.name !== null ? (
                  <ConformForm
                    key={selectedArea.slug}
                    useFormOptions={{
                      id: `delete-filter-${selectedArea.slug}`,
                      defaultValue: {
                        ...loaderData.submission.value,
                        evtFilter: {
                          ...loaderData.submission.value.evtFilter,
                          area: loaderData.submission.value.evtFilter.area.filter(
                            (area) => area !== selectedArea.slug
                          ),
                        },
                        showFilters: "",
                      },
                      constraint: getZodConstraint(getFilterSchemes),
                      lastResult:
                        navigation.state === "idle"
                          ? loaderData.submission
                          : null,
                    }}
                    formProps={{
                      method: "get",
                      preventScrollReset: true,
                    }}
                  >
                    <HiddenFilterInputsInContext />
                    <Chip size="medium">
                      {selectedArea.name}
                      <Chip.Delete>
                        <button
                          type="submit"
                          disabled={navigation.state === "loading"}
                        >
                          X
                        </button>
                      </Chip.Delete>
                    </Chip>
                  </ConformForm>
                ) : null;
              })}
            </div>
            <Form
              {...getFormProps(resetForm)}
              method="get"
              preventScrollReset
              className="mv-w-fit"
            >
              <HiddenFilterInputs
                fields={resetFields}
                defaultValue={loaderData.submission.value}
              />
              <Button
                type="submit"
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                {locales.route.filter.reset}
              </Button>
            </Form>
          </div>
        )}
      </section>

      <section className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl">
        {typeof loaderData.filteredByVisibilityCount !== "undefined" &&
        loaderData.filteredByVisibilityCount !== loaderData.eventsCount ? (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4 mv-mx-4 @md:mv-mx-0">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.notShown_one,
                locales.route.notShown_other,
                loaderData.eventsCount - loaderData.filteredByVisibilityCount
              ),
              {
                count:
                  loaderData.eventsCount - loaderData.filteredByVisibilityCount,
              }
            )}
          </p>
        ) : loaderData.eventsCount === 0 ? (
          <p className="mv-text-center mv-text-gray-700 mv-mb-4">
            {locales.route.empty}
          </p>
        ) : null}
        {loaderData.events.length > 0 && (
          <>
            <CardContainer type="multi row">
              {loaderData.events.map((event) => {
                const startTime = utcToZonedTime(
                  event.startTime,
                  "Europe/Berlin"
                );
                const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");
                const participationUntil = utcToZonedTime(
                  event.participationUntil,
                  "Europe/Berlin"
                );

                return (
                  <EventCard
                    key={event.id}
                    publicAccess={!loaderData.isLoggedIn}
                    locales={locales}
                    currentLanguage={loaderData.language}
                    event={{
                      ...event,
                      startTime,
                      endTime,
                      participationUntil,
                      responsibleOrganizations:
                        event.responsibleOrganizations.map(
                          (item) => item.organization
                        ),
                    }}
                  />
                );
              })}
            </CardContainer>
            {showMore && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-10 mv-mt-4 @lg:mv-mb-12 @lg:mv-mt-6 @xl:mv-mb-14 @xl:mv-mt-8">
                <Form
                  {...getFormProps(loadMoreForm)}
                  method="get"
                  preventScrollReset
                  replace
                >
                  <HiddenFilterInputs
                    fields={loadMoreFields}
                    defaultValue={loaderData.submission.value}
                  />
                  <Button
                    type="submit"
                    size="large"
                    variant="outline"
                    loading={navigation.state === "loading"}
                    disabled={navigation.state === "loading"}
                  >
                    {locales.route.more}
                  </Button>
                </Form>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
