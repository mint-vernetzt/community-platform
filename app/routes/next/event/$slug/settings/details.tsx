import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import {
  LastTimeStamp,
  UnsavedChangesModalParam,
} from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getFormPersistenceTimestamp } from "~/utils.server";
import {
  getAllEventTargetGroups,
  getAllEventTypes,
  getAllExperienceLevels,
  getAllFocuses,
  getAllTags,
  getEventBySlug,
  getEventBySlugForAction,
  updateEventBySlug,
} from "./details.server";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { getRedirectPathOnProtectedEventRoute } from "../settings.server";
import {
  createEventDetailsSchema,
  DESCRIPTION_MAX_LENGTH,
  SUBLINE_MAX_LENGTH,
} from "./details.shared";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { captureException } from "@sentry/node";
import { redirectWithToast } from "~/toast.server";
import { useHydrated } from "remix-utils/use-hydrated";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { UnsavedChangesModal } from "~/components/next/UnsavedChangesModal";
import BasicStructure from "~/components/next/BasicStructure";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import TitleSection from "~/components/next/TitleSection";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { ConformSelect } from "~/components-next/ConformSelect";
import { getLocaleFromSlug } from "~/i18n.shared";
import { Chip } from "@mint-vernetzt/components/src/molecules/Chip";
import { TextArea } from "~/components-next/TextArea";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const allEventTypes = await getAllEventTypes();
  const allTags = await getAllTags();
  const allEventTargetGroups = await getAllEventTargetGroups();
  const allExperienceLevels = await getAllExperienceLevels();
  const allFocuses = await getAllFocuses();

  const url = new URL(request.url);
  const lastTimeStampParam = url.searchParams.get(LastTimeStamp);
  const currentTimestamp = getFormPersistenceTimestamp(lastTimeStampParam);

  return {
    locales,
    event,
    allEventTypes,
    allTags,
    allEventTargetGroups,
    allExperienceLevels,
    allFocuses,
    currentTimestamp,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, [
    "events",
    "next_event_settings",
  ]);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details"];

  const formData = await request.formData();

  const schema = createEventDetailsSchema(locales.route.form.validation);
  const submission = await parseWithZod(formData, { schema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const event = await getEventBySlugForAction(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  try {
    const { experienceLevelList: ignored, ...rest } = submission.value;
    await updateEventBySlug(params.slug, event.id, rest);
  } catch (error) {
    captureException(error);
    return redirectWithToast(request.url, {
      id: "event-details-error",
      key: `event-details-error-${Date.now()}`,
      message: locales.route.errors.saveFailed,
      level: "negative",
    });
  }

  return redirectWithToast(request.url, {
    id: "event-details-success",
    key: `event-details-success-${Date.now()}`,
    message: locales.route.success,
  });
};

export default function Details() {
  const {
    locales,
    event,
    allEventTypes,
    allTags,
    allEventTargetGroups,
    allExperienceLevels,
    allFocuses,
    currentTimestamp,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData();
  const isHydrated = useHydrated();
  const isSubmitting = useIsSubmitting();
  const navigation = useNavigation();

  const [form, fields] = useForm({
    id: `event-details-form-${currentTimestamp}`,
    constraint: getZodConstraint(
      createEventDetailsSchema(locales.route.form.validation)
    ),
    shouldValidate: "onBlur",
    onValidate: (values) => {
      const submission = parseWithZod(values.formData, {
        schema: createEventDetailsSchema(locales.route.form.validation),
      });
      return submission;
    },
    defaultValue: {
      ...event,
      experienceLevel:
        event.experienceLevel !== null ? event.experienceLevel.id : null,
      types: event.types.map((relation) => relation.eventType.id),
      tags: event.tags.map((relation) => relation.tag.id),
      eventTargetGroups: event.eventTargetGroups.map(
        (relation) => relation.eventTargetGroup.id
      ),
      focuses: event.focuses.map((relation) => relation.focus.id),
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData : undefined,
  });

  const eventTypesList = fields.types.getFieldList();
  const tagsList = fields.tags.getFieldList();
  const eventTargetGroupsList = fields.eventTargetGroups.getFieldList();
  const focusesList = fields.focuses.getFieldList();
  const experienceLevelList = fields.experienceLevelList.getFieldList();
  const selectedExperienceLevelId =
    experienceLevelList.length > 0
      ? experienceLevelList[experienceLevelList.length - 1].initialValue || null
      : event.experienceLevel !== null
        ? event.experienceLevel.id
        : null;
  const selectedExperienceLevelSlug = allExperienceLevels.find((level) => {
    return level.id === selectedExperienceLevelId;
  })?.slug;
  const localizedSelectedExperienceLevel =
    typeof selectedExperienceLevelSlug !== "undefined"
      ? getLocaleFromSlug(selectedExperienceLevelSlug, locales.experienceLevels)
      : null;

  return (
    <>
      <UnsavedChangesModal
        searchParam={UnsavedChangesModalParam}
        formMetadataToCheck={form}
        locales={locales.components.UnsavedChangesModal}
        lastTimeStamp={currentTimestamp}
      />
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        <BasicStructure>
          <BasicStructure.Container
            deflatedUntil="lg"
            gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
            rounded="rounded-lg"
          >
            <TitleSection>
              <TitleSection.Headline>
                {locales.route.name.headline}
              </TitleSection.Headline>
            </TitleSection>
            <Input
              {...getInputProps(fields.name, { type: "text" })}
              countCharacters
            >
              <Input.Label htmlFor={fields.name.id}>
                {locales.route.name.label}
              </Input.Label>
              {typeof fields.name.errors !== "undefined" &&
                fields.name.errors.length > 0 &&
                fields.name.errors.map((error) => (
                  <Input.Error id={fields.name.errorId} key={error}>
                    {error}
                  </Input.Error>
                ))}
              <Input.HelperText>
                {locales.route.name.helperText}
              </Input.HelperText>
            </Input>
          </BasicStructure.Container>
          <BasicStructure.Container
            deflatedUntil="lg"
            gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
            rounded="rounded-lg"
          >
            <TitleSection>
              <TitleSection.Headline>
                {locales.route.infos.headline}
              </TitleSection.Headline>
            </TitleSection>
            <div className="w-full flex flex-col gap-2">
              <ConformSelect
                id={fields.types.id}
                cta={locales.route.infos.types.cta}
              >
                <ConformSelect.Label htmlFor={fields.types.id}>
                  {locales.route.infos.types.label}
                </ConformSelect.Label>
                {typeof fields.types.errors !== "undefined" &&
                fields.types.errors.length > 0 ? (
                  fields.types.errors.map((error) => (
                    <ConformSelect.Error id={fields.types.errorId} key={error}>
                      {error}
                    </ConformSelect.Error>
                  ))
                ) : (
                  <ConformSelect.HelperText>
                    {locales.route.infos.types.helperText}
                  </ConformSelect.HelperText>
                )}
                {allEventTypes
                  .filter((eventType) => {
                    return !eventTypesList.some((field) => {
                      return field.initialValue === eventType.id;
                    });
                  })
                  .map((eventType) => {
                    const localizedTitle = getLocaleFromSlug(
                      eventType.slug,
                      locales.types
                    );
                    return (
                      <button
                        key={eventType.id}
                        {...form.insert.getButtonProps({
                          name: fields.types.name,
                          defaultValue: eventType.id,
                        })}
                        {...ConformSelect.getListItemChildrenStyles()}
                      >
                        {localizedTitle}
                      </button>
                    );
                  })}
              </ConformSelect>
              {eventTypesList.length > 0 && (
                <Chip.Container>
                  {eventTypesList.map((field, index) => {
                    const eventTypeSlug = allEventTypes.find((eventType) => {
                      return eventType.id === field.initialValue;
                    })?.slug;

                    let localizedTitle;
                    if (eventTypeSlug === undefined) {
                      console.error(
                        `Event type with id ${field.id} not found in allEventTypes`
                      );
                      localizedTitle = null;
                    } else {
                      localizedTitle = getLocaleFromSlug(
                        eventTypeSlug,
                        locales.types
                      );
                    }
                    return (
                      <Chip key={field.key}>
                        <input {...getInputProps(field, { type: "hidden" })} />
                        {localizedTitle || locales.route.infos.types.notFound}
                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.types.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  })}
                </Chip.Container>
              )}
            </div>
            <TextArea
              {...getInputProps(fields.subline, {
                type: "text",
              })}
              id={fields.subline.id}
              label={locales.route.infos.subline.label}
              placeholder={locales.rte.placeholder}
              helperText={insertParametersIntoLocale(
                locales.route.infos.subline.helperText,
                {
                  max: SUBLINE_MAX_LENGTH,
                }
              )}
              errorMessage={
                Array.isArray(fields.subline.errors)
                  ? fields.subline.errors.join(", ")
                  : undefined
              }
              errorId={fields.subline.errorId}
              maxLength={SUBLINE_MAX_LENGTH}
            />
            <TextArea
              {...getInputProps(fields.description, {
                type: "text",
              })}
              id={fields.description.id}
              label={locales.route.infos.description.label}
              helperText={insertParametersIntoLocale(
                locales.route.infos.description.helperText,
                {
                  max: DESCRIPTION_MAX_LENGTH,
                }
              )}
              errorMessage={
                Array.isArray(fields.description.errors)
                  ? fields.description.errors.join(", ")
                  : undefined
              }
              errorId={fields.description.errorId}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rte={{
                isFormDirty: form.dirty,
                locales: { rte: locales.rte },
                defaultValue: fields.descriptionRTEState.initialValue,
              }}
            />
          </BasicStructure.Container>
          <BasicStructure.Container
            deflatedUntil="lg"
            gaps={{ base: "gap-4", md: "gap-4", xl: "gap-4" }}
            rounded="rounded-lg"
          >
            <TitleSection>
              <TitleSection.Headline>
                {locales.route.keywords.headline}
              </TitleSection.Headline>
            </TitleSection>
            <div className="w-full flex flex-col gap-2">
              <ConformSelect
                id={fields.tags.id}
                cta={locales.route.keywords.tags.cta}
              >
                <ConformSelect.Label htmlFor={fields.tags.id}>
                  {locales.route.keywords.tags.label}
                </ConformSelect.Label>
                {typeof fields.tags.errors !== "undefined" &&
                fields.tags.errors.length > 0 ? (
                  fields.tags.errors.map((error) => (
                    <ConformSelect.Error id={fields.tags.errorId} key={error}>
                      {error}
                    </ConformSelect.Error>
                  ))
                ) : (
                  <ConformSelect.HelperText>
                    {locales.route.keywords.tags.helperText}
                  </ConformSelect.HelperText>
                )}
                {allTags
                  .filter((tag) => {
                    return !tagsList.some((field) => {
                      return field.initialValue === tag.id;
                    });
                  })
                  .map((tag) => {
                    const localizedTitle = getLocaleFromSlug(
                      tag.slug,
                      locales.tags
                    );
                    return (
                      <button
                        key={tag.id}
                        {...form.insert.getButtonProps({
                          name: fields.tags.name,
                          defaultValue: tag.id,
                        })}
                        {...ConformSelect.getListItemChildrenStyles()}
                      >
                        {localizedTitle}
                      </button>
                    );
                  })}
              </ConformSelect>
              {tagsList.length > 0 && (
                <Chip.Container>
                  {tagsList.map((field, index) => {
                    const tagSlug = allTags.find((tag) => {
                      return tag.id === field.initialValue;
                    })?.slug;

                    let localizedTitle;
                    if (tagSlug === undefined) {
                      console.error(
                        `Tag with id ${field.id} not found in allTags`
                      );
                      localizedTitle = null;
                    } else {
                      localizedTitle = getLocaleFromSlug(tagSlug, locales.tags);
                    }
                    return (
                      <Chip key={field.key}>
                        <input {...getInputProps(field, { type: "hidden" })} />
                        {localizedTitle || locales.route.keywords.tags.notFound}
                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.tags.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  })}
                </Chip.Container>
              )}
            </div>
            <div className="w-full flex flex-col gap-2">
              <ConformSelect
                id={fields.eventTargetGroups.id}
                cta={locales.route.keywords.eventTargetGroups.cta}
              >
                <ConformSelect.Label htmlFor={fields.eventTargetGroups.id}>
                  {locales.route.keywords.eventTargetGroups.label}
                </ConformSelect.Label>
                {typeof fields.eventTargetGroups.errors !== "undefined" &&
                fields.eventTargetGroups.errors.length > 0 ? (
                  fields.eventTargetGroups.errors.map((error) => (
                    <ConformSelect.Error
                      id={fields.eventTargetGroups.errorId}
                      key={error}
                    >
                      {error}
                    </ConformSelect.Error>
                  ))
                ) : (
                  <ConformSelect.HelperText>
                    {locales.route.keywords.eventTargetGroups.helperText}
                  </ConformSelect.HelperText>
                )}
                {allEventTargetGroups
                  .filter((targetGroup) => {
                    return !eventTargetGroupsList.some((field) => {
                      return field.initialValue === targetGroup.id;
                    });
                  })
                  .map((targetGroup) => {
                    const localizedTitle = getLocaleFromSlug(
                      targetGroup.slug,
                      locales.eventTargetGroups
                    );
                    return (
                      <button
                        key={targetGroup.id}
                        {...form.insert.getButtonProps({
                          name: fields.eventTargetGroups.name,
                          defaultValue: targetGroup.id,
                        })}
                        {...ConformSelect.getListItemChildrenStyles()}
                      >
                        {localizedTitle}
                      </button>
                    );
                  })}
              </ConformSelect>
              {eventTargetGroupsList.length > 0 && (
                <Chip.Container>
                  {eventTargetGroupsList.map((field, index) => {
                    const targetGroupSlug = allEventTargetGroups.find(
                      (targetGroup) => {
                        return targetGroup.id === field.initialValue;
                      }
                    )?.slug;

                    let localizedTitle;
                    if (targetGroupSlug === undefined) {
                      console.error(
                        `Tag with id ${field.id} not found in allEventTargetGroups`
                      );
                      localizedTitle = null;
                    } else {
                      localizedTitle = getLocaleFromSlug(
                        targetGroupSlug,
                        locales.eventTargetGroups
                      );
                    }
                    return (
                      <Chip key={field.key}>
                        <input {...getInputProps(field, { type: "hidden" })} />
                        {localizedTitle ||
                          locales.route.keywords.eventTargetGroups.notFound}
                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.eventTargetGroups.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  })}
                </Chip.Container>
              )}
            </div>
            <input
              type="hidden"
              name={fields.experienceLevel.name}
              defaultValue={selectedExperienceLevelId || undefined}
            />
            <ConformSelect
              id={fields.experienceLevelList.id}
              cta={
                localizedSelectedExperienceLevel ||
                locales.route.keywords.experienceLevels.cta
              }
              closeOnSelect
              dimmed={selectedExperienceLevelId === null}
            >
              <ConformSelect.Label htmlFor={fields.experienceLevelList.id}>
                {locales.route.keywords.experienceLevels.label}
              </ConformSelect.Label>
              {typeof fields.experienceLevelList.errors !== "undefined" &&
              fields.experienceLevelList.errors.length > 0
                ? fields.experienceLevelList.errors.map((error) => (
                    <ConformSelect.Error
                      id={fields.experienceLevelList.errorId}
                      key={error}
                    >
                      {error}
                    </ConformSelect.Error>
                  ))
                : typeof fields.experienceLevel.errors !== "undefined" &&
                    fields.experienceLevel.errors.length > 0
                  ? fields.experienceLevel.errors.map((error) => (
                      <ConformSelect.Error
                        id={fields.experienceLevel.errorId}
                        key={error}
                      >
                        {error}
                      </ConformSelect.Error>
                    ))
                  : null}
              <button
                {...form.insert.getButtonProps({
                  name: fields.experienceLevelList.name,
                  defaultValue: null,
                })}
                {...ConformSelect.getListItemChildrenStyles({
                  deemphasized: true,
                })}
              >
                {locales.route.keywords.experienceLevels.cta}
              </button>
              {allExperienceLevels
                .filter(
                  (experienceLevel) =>
                    experienceLevel.id !== selectedExperienceLevelId
                )
                .map((experienceLevel) => {
                  const localizedTitle = getLocaleFromSlug(
                    experienceLevel.slug,
                    locales.experienceLevels
                  );
                  return (
                    <button
                      key={experienceLevel.id}
                      {...form.insert.getButtonProps({
                        name: fields.experienceLevelList.name,
                        defaultValue: experienceLevel.id,
                      })}
                      {...ConformSelect.getListItemChildrenStyles()}
                    >
                      {localizedTitle}
                    </button>
                  );
                })}
            </ConformSelect>
            <div className="w-full flex flex-col gap-2">
              <ConformSelect
                id={fields.focuses.id}
                cta={locales.route.keywords.focuses.cta}
              >
                <ConformSelect.Label htmlFor={fields.focuses.id}>
                  {locales.route.keywords.focuses.label}
                </ConformSelect.Label>
                {typeof fields.focuses.errors !== "undefined" &&
                fields.focuses.errors.length > 0 ? (
                  fields.focuses.errors.map((error) => (
                    <ConformSelect.Error
                      id={fields.focuses.errorId}
                      key={error}
                    >
                      {error}
                    </ConformSelect.Error>
                  ))
                ) : (
                  <ConformSelect.HelperText>
                    {locales.route.keywords.focuses.helperText}
                  </ConformSelect.HelperText>
                )}
                {allFocuses
                  .filter((focus) => {
                    return !focusesList.some((field) => {
                      return field.initialValue === focus.id;
                    });
                  })
                  .map((focus) => {
                    const localizedTitle = getLocaleFromSlug(
                      focus.slug,
                      locales.focuses
                    );
                    return (
                      <button
                        key={focus.id}
                        {...form.insert.getButtonProps({
                          name: fields.focuses.name,
                          defaultValue: focus.id,
                        })}
                        {...ConformSelect.getListItemChildrenStyles()}
                      >
                        {localizedTitle}
                      </button>
                    );
                  })}
              </ConformSelect>
              {focusesList.length > 0 && (
                <Chip.Container>
                  {focusesList.map((field, index) => {
                    const focusSlug = allFocuses.find((focus) => {
                      return focus.id === field.initialValue;
                    })?.slug;

                    let localizedTitle;
                    if (focusSlug === undefined) {
                      console.error(
                        `Tag with id ${field.id} not found in allFocuses`
                      );
                      localizedTitle = null;
                    } else {
                      localizedTitle = getLocaleFromSlug(
                        focusSlug,
                        locales.focuses
                      );
                    }
                    return (
                      <Chip key={field.key}>
                        <input {...getInputProps(field, { type: "hidden" })} />
                        {localizedTitle ||
                          locales.route.keywords.focuses.notFound}
                        <Chip.Delete>
                          <button
                            {...form.remove.getButtonProps({
                              name: fields.focuses.name,
                              index,
                            })}
                          />
                        </Chip.Delete>
                      </Chip>
                    );
                  })}
                </Chip.Container>
              )}
            </div>
          </BasicStructure.Container>
          <div className="w-full flex flex-col md:flex-row md:justify-between gap-4">
            <p className="text-neutral-700 text-sm font-normal leading-4.5">
              {locales.route.requiredHint}
            </p>
            <div className="w-full md:w-fit flex flex-col md:flex-row-reverse gap-4">
              <div className="w-full md:w-fit">
                <Button
                  type="submit"
                  fullSize
                  form={form.id} // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? form.dirty === false ||
                        form.valid === false ||
                        isSubmitting
                      : false
                  }
                >
                  {locales.route.cta}
                </Button>
              </div>
              <div className="w-full md:w-fit">
                <div className="relative w-full">
                  <Button
                    type="reset"
                    onClick={() => {
                      setTimeout(() => form.reset(), 0);
                    }}
                    variant="outline"
                    fullSize
                    // Don't disable button when js is disabled
                    disabled={isHydrated ? form.dirty === false : false}
                  >
                    {locales.route.cancel}
                  </Button>
                  <noscript className="absolute top-0">
                    <Button as="link" to="." variant="outline" fullSize>
                      {locales.route.cancel}
                    </Button>
                  </noscript>
                </div>
              </div>
            </div>
          </div>
        </BasicStructure>
      </Form>
    </>
  );
}
