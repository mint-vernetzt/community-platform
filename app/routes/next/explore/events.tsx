import {
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useForm,
} from "@conform-to/react-v1";
import { parseWithZod } from "@conform-to/zod-v1";
import {
  Button,
  CardContainer,
  Chip,
  EventCard,
  Input,
} from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { utcToZonedTime } from "date-fns-tz";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDebounceSubmit } from "remix-utils/use-debounce-submit";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getFeatureAbilities } from "~/lib/utils/application";
import { invariantResponse } from "~/lib/utils/response";
import { type ArrayElement } from "~/lib/utils/types";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import {
  Dropdown,
  Filters,
  FormControl,
  ShowFiltersButton,
} from "./__components";
import {
  enhanceEventsWithParticipationStatus,
  getAllEventTargetGroups,
  getAllEventTypes,
  getAllEvents,
  getAllFocuses,
  getEventFilterVector,
  getEventsCount,
  getFilterCountForSlug,
  getTakeParam,
  getVisibilityFilteredEventsCount,
} from "./events.server";
import { getAreaNameBySlug, getAreasBySearchQuery } from "./utils.server";

const i18nNS = ["routes/explore/events"];
export const handle = {
  i18n: i18nNS,
};

const sortValues = ["startTime-asc", "name-asc", "name-desc"] as const;
export const periodOfTimeValues = [
  "now",
  "thisWeek",
  "nextWeek",
  "thisMonth",
  "nextMonth",
  "past",
] as const;

export type GetEventsSchema = z.infer<typeof getEventsSchema>;

const getEventsSchema = z.object({
  filter: z
    .object({
      type: z.array(z.string()),
      focus: z.array(z.string()),
      eventTargetGroup: z.array(z.string()),
      periodOfTime: z
        .enum(periodOfTimeValues)
        .optional()
        .transform((periodOfTime) => {
          if (periodOfTime === undefined) {
            return periodOfTimeValues[0];
          }
          return periodOfTime;
        }),
      area: z.array(z.string()),
    })
    .optional()
    .transform((filter) => {
      if (filter === undefined) {
        return {
          type: [],
          focus: [],
          eventTargetGroup: [],
          periodOfTime: periodOfTimeValues[0],
          area: [],
        };
      }
      return filter;
    }),
  sortBy: z
    .enum(sortValues)
    .optional()
    .transform((sortValue) => {
      if (sortValue !== undefined) {
        const splittedValue = sortValue.split("-");
        return {
          value: splittedValue[0],
          direction: splittedValue[1],
        };
      }
      return {
        value: sortValues[0].split("-")[0],
        direction: sortValues[0].split("-")[1],
      };
    }),
  page: z
    .number()
    .optional()
    .transform((page) => {
      if (page === undefined) {
        return 1;
      }
      return page;
    }),
  search: z
    .string()
    .optional()
    .transform((searchQuery) => {
      if (searchQuery === undefined) {
        return "";
      }
      return searchQuery;
    }),
  showFilters: z.boolean().optional(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: getEventsSchema,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );
  const take = getTakeParam(submission.value.page);
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);
  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/events");
  }

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn) {
    filteredByVisibilityCount = await getVisibilityFilteredEventsCount({
      filter: submission.value.filter,
    });
  }
  const eventsCount = await getEventsCount({
    filter: submission.value.filter,
  });
  const events = await getAllEvents({
    filter: submission.value.filter,
    sortBy: submission.value.sortBy,
    take,
    isLoggedIn,
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
    let blurredBackground;
    if (enhancedEvent.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedEvent.background);
      if (publicURL) {
        enhancedEvent.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
        });
      }
      blurredBackground = getImageURL(publicURL, {
        resize: { type: "fill", width: 87, height: 40 },
        blur: 5,
      });
    } else {
      enhancedEvent.background = "/images/default-event-background.jpg";
      blurredBackground = "/images/default-event-background-blurred.jpg";
    }

    enhancedEvent.responsibleOrganizations =
      enhancedEvent.responsibleOrganizations.map((relation) => {
        let logo = relation.organization.logo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL) {
            logo = getImageURL(publicURL, {
              resize: { type: "fill", width: 36, height: 36 },
            });
          }
        }
        return {
          ...relation,
          organization: { ...relation.organization, logo },
        };
      });

    const imageEnhancedEvent = {
      ...enhancedEvent,
      blurredBackground,
    };

    enhancedEvents.push(imageEnhancedEvent);
  }

  const enhancedEventsWithParticipationStatus =
    await enhanceEventsWithParticipationStatus(sessionUser, enhancedEvents);

  const filterVector = await getEventFilterVector({
    filter: submission.value.filter,
  });

  const areas = await getAreasBySearchQuery(submission.value.search);
  type EnhancedAreas = Array<
    ArrayElement<Awaited<ReturnType<typeof getAreasBySearchQuery>>> & {
      vectorCount: ReturnType<typeof getFilterCountForSlug>;
      isChecked: boolean;
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(area.slug, filterVector, "area");
    const isChecked = submission.value.filter.area.includes(area.slug);
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  const selectedAreas = await Promise.all(
    submission.value.filter.area.map(async (slug) => {
      const vectorCount = getFilterCountForSlug(slug, filterVector, "area");
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

  const types = await getAllEventTypes();
  const enhancedTypes = types.map((type) => {
    const vectorCount = getFilterCountForSlug(type.slug, filterVector, "type");
    const isChecked = submission.value.filter.type.includes(type.slug);
    return { ...type, vectorCount, isChecked };
  });
  const selectedTypes = submission.value.filter.type.map((slug) => {
    const typeMatch = types.find((type) => {
      return type.slug === slug;
    });
    return {
      slug,
      title: typeMatch?.title || null,
    };
  });

  const focuses = await getAllFocuses();
  const enhancedFocuses = focuses.map((focus) => {
    const vectorCount = getFilterCountForSlug(
      focus.slug,
      filterVector,
      "focus"
    );
    const isChecked = submission.value.filter.focus.includes(focus.slug);
    return { ...focus, vectorCount, isChecked };
  });
  const selectedFocuses = submission.value.filter.focus.map((slug) => {
    const focusMatch = focuses.find((focus) => {
      return focus.slug === slug;
    });
    return {
      slug,
      title: focusMatch?.title || null,
    };
  });

  const targetGroups = await getAllEventTargetGroups();
  const enhancedTargetGroups = targetGroups.map((targetGroup) => {
    const vectorCount = getFilterCountForSlug(
      targetGroup.slug,
      filterVector,
      "eventTargetGroup"
    );
    const isChecked = submission.value.filter.eventTargetGroup.includes(
      targetGroup.slug
    );
    return { ...targetGroup, vectorCount, isChecked };
  });
  const selectedTargetGroups = submission.value.filter.eventTargetGroup.map(
    (slug) => {
      const targetGroupMatch = targetGroups.find((targetGroup) => {
        return targetGroup.slug === slug;
      });
      return {
        slug,
        title: targetGroupMatch?.title || null,
      };
    }
  );

  return json({
    isLoggedIn,
    events: enhancedEventsWithParticipationStatus,
    areas: enhancedAreas,
    selectedAreas,
    focuses: enhancedFocuses,
    selectedFocuses,
    targetGroups: enhancedTargetGroups,
    selectedTargetGroups,
    types: enhancedTypes,
    selectedTypes,
    submission,
    filteredByVisibilityCount,
    eventsCount,
  });
};

export default function ExploreOrganizations() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const location = useLocation();
  const submit = useSubmit();
  const debounceSubmit = useDebounceSubmit();
  const { t } = useTranslation(i18nNS);

  const [form, fields] = useForm<GetEventsSchema>({
    lastResult: loaderData.submission,
    defaultValue: loaderData.submission.value,
  });

  const filter = fields.filter.getFieldset();

  const page = loaderData.submission.value.page;
  const loadMoreSearchParams = new URLSearchParams(searchParams);
  loadMoreSearchParams.set("page", `${page + 1}`);

  const [searchQuery, setSearchQuery] = React.useState(
    loaderData.submission.value.search
  );

  // TODO: Remove this and add new <Image> Component to <EventCard>
  const isHydrated = useHydrated();

  return (
    <>
      <section className="mv-container mv-mb-12 mv-mt-5 md:mv-mt-7 lg:mv-mt-8 mv-text-center">
        <H1 className="mv-mb-4 md:mv-mb-2 lg:mv-mb-3" like="h0">
          {t("title")}
        </H1>
        <p>{t("intro")}</p>
      </section>

      <section className="mv-container mv-mb-4">
        <Form
          {...getFormProps(form)}
          method="get"
          onChange={(event) => {
            submit(event.currentTarget, { preventScrollReset: true });
          }}
          preventScrollReset
        >
          <input name="page" defaultValue="1" hidden />
          <ShowFiltersButton
            {...getInputProps(fields.showFilters, {
              type: "checkbox",
              value: loaderData.submission.value.showFilters === true,
            })}
          >
            {t("filter.showFiltersLabel")}
          </ShowFiltersButton>
          <Filters showFilters={loaderData.submission.value.showFilters}>
            <Filters.Title>{t("filter.title")}</Filters.Title>
            <Filters.Fieldset
              className="mv-flex mv-flex-wrap lg:mv-gap-4"
              {...getFieldsetProps(fields.filter)}
              showMore={t("filter.showMore")}
              showLess={t("filter.showLess")}
            >
              <Dropdown>
                <Dropdown.Label>
                  {t("filter.types")}
                  <span className="mv-font-normal lg:mv-hidden">
                    <br />
                    {loaderData.selectedTypes
                      .map((type) => {
                        return type.title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.types.map((type) => {
                    return (
                      <FormControl
                        {...getInputProps(filter.type, {
                          type: "checkbox",
                          value: type.slug,
                        })}
                        key={type.slug}
                        defaultChecked={type.isChecked}
                        disabled={
                          (type.vectorCount === 0 && !type.isChecked) ||
                          navigation.state === "loading"
                        }
                      >
                        <FormControl.Label>
                          {type.title}
                          {type.description !== null ? (
                            <p className="mv-text-sm">{type.description}</p>
                          ) : null}
                        </FormControl.Label>
                        <FormControl.Counter>
                          {type.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {t("filter.focuses")}
                  <span className="mv-font-normal lg:mv-hidden">
                    <br />
                    {loaderData.selectedFocuses
                      .map((focus) => {
                        return focus.title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.focuses.map((focus) => {
                    return (
                      <FormControl
                        {...getInputProps(filter.focus, {
                          type: "checkbox",
                          value: focus.slug,
                        })}
                        key={focus.slug}
                        defaultChecked={focus.isChecked}
                        disabled={
                          (focus.vectorCount === 0 && !focus.isChecked) ||
                          navigation.state === "loading"
                        }
                      >
                        <FormControl.Label>
                          {focus.title}
                          {focus.description !== null ? (
                            <p className="mv-text-sm">{focus.description}</p>
                          ) : null}
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
                  {t("filter.targetGroups")}
                  <span className="mv-font-normal lg:mv-hidden">
                    <br />
                    {loaderData.selectedTargetGroups
                      .map((targetGroup) => {
                        return targetGroup.title;
                      })
                      .join(", ")}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {loaderData.targetGroups.map((targetGroup) => {
                    return (
                      <FormControl
                        {...getInputProps(filter.eventTargetGroup, {
                          type: "checkbox",
                          value: targetGroup.slug,
                        })}
                        key={targetGroup.slug}
                        defaultChecked={targetGroup.isChecked}
                        disabled={
                          (targetGroup.vectorCount === 0 &&
                            !targetGroup.isChecked) ||
                          navigation.state === "loading"
                        }
                      >
                        <FormControl.Label>
                          {targetGroup.title}
                          {targetGroup.description !== null ? (
                            <p className="mv-text-sm">
                              {targetGroup.description}
                            </p>
                          ) : null}
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
                  <span className="lg:mv-hidden">
                    {t("filter.periodOfTime.label")}
                    <br />
                  </span>
                  <span className="mv-font-normal lg:mv-font-semibold">
                    {t(
                      `filter.periodOfTime.${loaderData.submission.value.filter.periodOfTime}`
                    )}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {periodOfTimeValues.map((periodOfTimeValue) => {
                    const submissionFilter = loaderData.submission.value.filter;
                    return (
                      <FormControl
                        {...getInputProps(filter.periodOfTime, {
                          type: "radio",
                          value: periodOfTimeValue,
                        })}
                        key={periodOfTimeValue}
                        defaultChecked={
                          submissionFilter !== undefined
                            ? submissionFilter.periodOfTime !== undefined
                              ? submissionFilter.periodOfTime ===
                                periodOfTimeValue
                              : periodOfTimeValues[0] === periodOfTimeValue
                            : periodOfTimeValues[0] === periodOfTimeValue
                        }
                        disabled={navigation.state === "loading"}
                      >
                        <FormControl.Label>
                          {t(`filter.periodOfTime.${periodOfTimeValue}`)}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
              <Dropdown>
                <Dropdown.Label>
                  {t("filter.areas")}
                  <span className="mv-font-normal lg:mv-hidden">
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
                    return (
                      <FormControl
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={area.isChecked}
                        disabled={
                          (area.vectorCount === 0 && !area.isChecked) ||
                          navigation.state === "loading"
                        }
                      >
                        <FormControl.Label>{area.name}</FormControl.Label>
                        <FormControl.Counter>
                          {area.vectorCount}
                        </FormControl.Counter>
                      </FormControl>
                    );
                  })}
                  {loaderData.areas.country.map((area) => {
                    return (
                      <FormControl
                        {...getInputProps(filter.area, {
                          type: "checkbox",
                          value: area.slug,
                        })}
                        key={area.slug}
                        defaultChecked={area.isChecked}
                        disabled={
                          (area.vectorCount === 0 && !area.isChecked) ||
                          navigation.state === "loading"
                        }
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
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: selectedArea.slug,
                          })}
                          key={selectedArea.slug}
                          defaultChecked
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
                      id={fields.search.id}
                      name={fields.search.name}
                      type="text"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.currentTarget.value);
                        event.stopPropagation();
                        debounceSubmit(event.currentTarget.form, {
                          debounceTimeout: 250,
                          preventScrollReset: true,
                          replace: true,
                        });
                      }}
                      placeholder={t("filter.searchAreaPlaceholder")}
                    >
                      <Input.Label htmlFor={fields.search.id} hidden>
                        {t("filter.searchAreaPlaceholder")}
                      </Input.Label>
                      <Input.HelperText>
                        {t("filter.searchAreaHelper")}
                      </Input.HelperText>
                      <Input.Controls>
                        <noscript>
                          <Button>{t("filter.searchAreaButton")}</Button>
                        </noscript>
                      </Input.Controls>
                    </Input>
                  </div>
                  {loaderData.areas.state.length > 0 && (
                    <Dropdown.Legend>{t("filter.stateLabel")}</Dropdown.Legend>
                  )}
                  {loaderData.areas.state.length > 0 &&
                    loaderData.areas.state.map((area) => {
                      return (
                        <FormControl
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          defaultChecked={area.isChecked}
                          disabled={
                            (area.vectorCount === 0 && !area.isChecked) ||
                            navigation.state === "loading"
                          }
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
                      {t("filter.districtLabel")}
                    </Dropdown.Legend>
                  )}
                  {loaderData.areas.district.length > 0 &&
                    loaderData.areas.district.map((area) => {
                      return (
                        <FormControl
                          {...getInputProps(filter.area, {
                            type: "checkbox",
                            value: area.slug,
                          })}
                          key={area.slug}
                          defaultChecked={area.isChecked}
                          disabled={
                            (area.vectorCount === 0 && !area.isChecked) ||
                            navigation.state === "loading"
                          }
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
            <Filters.Fieldset {...getFieldsetProps(fields.sortBy)}>
              <Dropdown orientation="right">
                <Dropdown.Label>
                  <span className="lg:mv-hidden">
                    {t("filter.sortBy.label")}
                    <br />
                  </span>
                  <span className="mv-font-normal lg:mv-font-semibold">
                    {t(
                      `filter.sortBy.${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`
                    )}
                  </span>
                </Dropdown.Label>
                <Dropdown.List>
                  {sortValues.map((sortValue) => {
                    const submissionSortValue = `${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`;
                    return (
                      <FormControl
                        {...getInputProps(fields.sortBy, {
                          type: "radio",
                          value: sortValue,
                        })}
                        key={sortValue}
                        defaultChecked={submissionSortValue === sortValue}
                        disabled={navigation.state === "loading"}
                      >
                        <FormControl.Label>
                          {t(`filter.sortBy.${sortValue}`)}
                        </FormControl.Label>
                      </FormControl>
                    );
                  })}
                </Dropdown.List>
              </Dropdown>
            </Filters.Fieldset>
            <Filters.ResetButton
              to={`${location.pathname}${
                loaderData.submission.value.sortBy !== undefined
                  ? `?sortBy=${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`
                  : ""
              }`}
            >
              {t("filter.reset")}
            </Filters.ResetButton>
            <Filters.ApplyButton>
              {t("showNumberOfItems", {
                count: loaderData.eventsCount,
              })}
            </Filters.ApplyButton>
          </Filters>
          <noscript>
            <Button>{t("filter.apply")}</Button>
          </noscript>
        </Form>
      </section>
      <div className="mv-container mv-mb-4">
        <hr className="mv-border-t mv-border-gray-200 mv-mt-4" />
      </div>
      <section className="container mb-6">
        {(loaderData.selectedTypes.length > 0 ||
          loaderData.selectedFocuses.length > 0 ||
          loaderData.selectedTargetGroups.length > 0 ||
          loaderData.selectedAreas.length > 0) && (
          <div className="mv-flex mv-flex-col">
            <div className="mv-overflow-scroll lg:mv-overflow-auto mv-flex mv-flex-nowrap lg:mv-flex-wrap mv-w-full mv-gap-2 mv-pb-4">
              {loaderData.selectedTypes.map((selectedType) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.type.name, selectedType.slug);
                return selectedType.title !== null ? (
                  <Chip key={selectedType.slug} responsive>
                    {selectedType.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                ) : null;
              })}
              {loaderData.selectedFocuses.map((selectedFocus) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.focus.name,
                  selectedFocus.slug
                );
                return selectedFocus.title !== null ? (
                  <Chip key={selectedFocus.slug} responsive>
                    {selectedFocus.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                ) : null;
              })}
              {loaderData.selectedTargetGroups.map((selectedTargetGroup) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(
                  filter.eventTargetGroup.name,
                  selectedTargetGroup.slug
                );
                return selectedTargetGroup.title !== null ? (
                  <Chip key={selectedTargetGroup.slug} responsive>
                    {selectedTargetGroup.title}
                    <Chip.Delete disabled={navigation.state === "loading"}>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                ) : null;
              })}
              {loaderData.selectedAreas.map((selectedArea) => {
                const deleteSearchParams = new URLSearchParams(searchParams);
                deleteSearchParams.delete(filter.area.name, selectedArea.slug);
                return selectedArea.name !== null ? (
                  <Chip key={selectedArea.slug} responsive>
                    {selectedArea.name}
                    <Chip.Delete disabled={navigation.state === "loading"}>
                      <Link
                        to={`${
                          location.pathname
                        }?${deleteSearchParams.toString()}`}
                        preventScrollReset
                      >
                        X
                      </Link>
                    </Chip.Delete>
                  </Chip>
                ) : null;
              })}
            </div>
            <Link
              to={`${location.pathname}${
                loaderData.submission.value.sortBy !== undefined
                  ? `?sortBy=${loaderData.submission.value.sortBy.value}-${loaderData.submission.value.sortBy.direction}`
                  : ""
              }`}
              preventScrollReset
              className="ml-2"
            >
              <Button
                variant="outline"
                loading={navigation.state === "loading"}
                disabled={navigation.state === "loading"}
              >
                {t("filter.reset")}
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        {loaderData.filteredByVisibilityCount !== undefined &&
        loaderData.filteredByVisibilityCount > 0 ? (
          <p className="text-center text-gray-700 mb-4 mv-mx-4 md:mv-mx-0">
            {t("notShown", { count: loaderData.filteredByVisibilityCount })}
          </p>
        ) : loaderData.eventsCount > 0 ? (
          <p className="text-center text-gray-700 mb-4">
            <strong>{loaderData.eventsCount}</strong>{" "}
            {t("itemsCountSuffix", { count: loaderData.eventsCount })}
          </p>
        ) : (
          <p className="text-center text-gray-700 mb-4">{t("empty")}</p>
        )}
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
                    isHydrated={isHydrated}
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
            {loaderData.eventsCount > loaderData.events.length && (
              <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
                <Link
                  to={`${location.pathname}?${loadMoreSearchParams.toString()}`}
                  preventScrollReset
                  replace
                >
                  <Button
                    size="large"
                    variant="outline"
                    loading={navigation.state === "loading"}
                    disabled={navigation.state === "loading"}
                  >
                    {t("more")}
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
