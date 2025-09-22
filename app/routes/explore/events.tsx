import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
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
  let eventIdsFilteredByVisibility;
  if (!isLoggedIn) {
    eventIdsFilteredByVisibility = await getEventIds({
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
    take,
    eventIds:
      typeof eventIdsFilteredByVisibility !== "undefined"
        ? eventIdsFilteredByVisibility
        : eventIds,
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
      search: [loaderData.submission.value.search.join(" ")],
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
      search: [loaderData.submission.value.search.join(" ")],
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
        eventTargetGroup: [],
        focus: [],
        periodOfTime: PERIOD_OF_TIME_VALUES[0],
        stage: "all",
      },
      evtPage: 1,
      evtSortBy: EVENT_SORT_VALUES[0],
      search: [loaderData.submission.value.search.join(" ")],
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
      <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl mb-4">
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
          <ShowFiltersButton
            showFilters={loaderData.submission.value.showFilters}
          >
            {locales.route.filter.showFiltersLabel}
          </ShowFiltersButton>
          <Filters
            showFilters={searchParams.get(fields.showFilters.name) === "on"}
          >
            <Filters.Title>{locales.route.filter.title}</Filters.Title>
            <Filters.Fieldset
              className="flex flex-wrap @lg:gap-4"
              {...getFieldsetProps(fields.evtFilter)}
              showMore={locales.route.filter.showMore}
              showLess={locales.route.filter.showLess}
            >
              <Dropdown>
                <Dropdown.Label>
                  <span className="@lg:hidden">
                    {locales.route.filter.stage}
                    <br />
                  </span>
                  <span className="font-normal @lg:font-semibold">
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
                                  <p className="text-sm">{description}</p>
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
                  <span className="font-normal @lg:hidden">
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
                                  <p className="text-sm">{description}</p>
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
                  <span className="@lg:hidden">
                    {locales.route.filter.periodOfTime.label}
                    <br />
                  </span>
                  <span className="font-normal @lg:font-semibold">
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
                  <span className="font-normal @lg:hidden">
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
                                  <p className="text-sm">{description}</p>
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
            </Filters.Fieldset>
            <Filters.Fieldset {...getFieldsetProps(fields.evtSortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="@lg:hidden">
                    {locales.route.filter.sortBy.label}
                    <br />
                  </span>
                  <span className="font-normal @lg:font-semibold">
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
          <noscript className="hidden @lg:block mt-2">
            <Button>{locales.route.filter.apply}</Button>
          </noscript>
        </Form>
      </section>
      <div
        className={
          loaderData.submission.value.showFilters === true
            ? "hidden @lg:block"
            : undefined
        }
      >
        <div className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl mb-4">
          <hr className="border-t border-gray-200 mt-4" />
        </div>
        <section className="w-full mx-auto px-4 @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @xl:px-6 @2xl:max-w-screen-container-2xl mb-6">
          {(loaderData.selectedFocuses.length > 0 ||
            loaderData.selectedTargetGroups.length > 0) && (
            <div className="flex flex-col gap-2">
              <div className="overflow-auto flex flex-nowrap @lg:flex-wrap w-full gap-2 pb-2">
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
                    console.error(
                      `Focus ${selectedFocus} not found in locales`
                    );
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
                          search: [
                            loaderData.submission.value.search.join(" "),
                          ],
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
                      locales.eventTargetGroups[
                        selectedTargetGroup as LocaleKey
                      ].title;
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
                          search: [
                            loaderData.submission.value.search.join(" "),
                          ],
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
              </div>
              <Form
                {...getFormProps(resetForm)}
                method="get"
                preventScrollReset
                className="w-fit"
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

        <section className="mx-auto @sm:px-4 @md:px-0 @xl:px-2 w-full @sm:max-w-screen-container-sm @md:max-w-screen-container-md @lg:max-w-screen-container-lg @xl:max-w-screen-container-xl @2xl:max-w-screen-container-2xl">
          {typeof loaderData.filteredByVisibilityCount !== "undefined" &&
          loaderData.filteredByVisibilityCount !== loaderData.eventsCount ? (
            <p className="text-center text-gray-700 mb-4 mx-4 @md:mx-0">
              {insertParametersIntoLocale(
                decideBetweenSingularOrPlural(
                  locales.route.notShown_one,
                  locales.route.notShown_other,
                  loaderData.eventsCount - loaderData.filteredByVisibilityCount
                ),
                {
                  count:
                    loaderData.eventsCount -
                    loaderData.filteredByVisibilityCount,
                }
              )}
            </p>
          ) : loaderData.eventsCount === 0 ? (
            <p className="text-center text-gray-700 mb-4">
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
                  const endTime = utcToZonedTime(
                    event.endTime,
                    "Europe/Berlin"
                  );
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
                      as="h2"
                      prefetch="intent"
                    />
                  );
                })}
              </CardContainer>
              {showMore && (
                <div className="w-full flex justify-center mb-10 mt-4 @lg:mb-12 @lg:mt-6 @xl:mb-14 @xl:mt-8">
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
      </div>
    </>
  );
}
