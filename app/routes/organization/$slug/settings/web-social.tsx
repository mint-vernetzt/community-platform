import { getFormProps, getInputProps, useForm } from "@conform-to/react-v1";
import { getZodConstraint, parseWithZod } from "@conform-to/zod-v1";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";
import { captureException } from "@sentry/node";
import { useHydrated } from "remix-utils/use-hydrated";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { useUnsavedChangesBlockerWithModal } from "~/lib/hooks/useUnsavedChangesBlockerWithModal";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import {
  checkboxSchema,
  createFacebookSchema,
  createInstagramSchema,
  createLinkedinSchema,
  createMastodonSchema,
  createTiktokSchema,
  createTwitterSchema,
  createWebsiteSchema,
  createXingSchema,
  createYoutubeSchema,
} from "~/lib/utils/schemas";
import { detectLanguage } from "~/i18n.server";
import { VisibilityCheckbox } from "~/components-next/VisibilityCheckbox";
import { getRedirectPathOnProtectedOrganizationRoute } from "~/routes/organization/$slug/utils.server";
import { BackButton } from "~/components-next/BackButton";
import { redirectWithToast } from "~/toast.server";
import {
  getOrganizationWebSocial,
  type OrganizationWebAndSocialLocales,
  updateOrganizationWebSocial,
} from "./web-social.server";
import { Section } from "@mint-vernetzt/components/src/organisms/containers/Section";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";
import { Controls } from "@mint-vernetzt/components/src/organisms/containers/Controls";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { languageModuleMap } from "~/locales/.server";

const createWebSocialSchema = (locales: OrganizationWebAndSocialLocales) =>
  z.object({
    website: createWebsiteSchema(locales),
    facebook: createFacebookSchema(locales),
    linkedin: createLinkedinSchema(locales),
    xing: createXingSchema(locales),
    twitter: createTwitterSchema(locales),
    mastodon: createMastodonSchema(locales),
    tiktok: createTiktokSchema(locales),
    instagram: createInstagramSchema(locales),
    youtube: createYoutubeSchema(locales),
    visibilities: z.object({
      website: checkboxSchema,
      facebook: checkboxSchema,
      linkedin: checkboxSchema,
      xing: checkboxSchema,
      twitter: checkboxSchema,
      mastodon: checkboxSchema,
      tiktok: checkboxSchema,
      instagram: checkboxSchema,
      youtube: checkboxSchema,
    }),
  });

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = getParamValueOrThrow(params, "slug");

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/web-social"];

  const organization = await getOrganizationWebSocial({ slug, locales });

  const currentTimestamp = new Date().getTime();

  return { organization, currentTimestamp, locales };
};

export async function action({ request, params }: ActionFunctionArgs) {
  const slug = getParamValueOrThrow(params, "slug");
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/settings/web-social"];

  const redirectPath = await getRedirectPathOnProtectedOrganizationRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  // Validation
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: () =>
      createWebSocialSchema(locales).transform(async (data, ctx) => {
        const { error } = await updateOrganizationWebSocial({
          slug,
          data,
        });
        if (error !== null) {
          console.error("Error updating organization", error);
          captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.updateFailed,
          });
          return z.NEVER;
        }

        return { ...data };
      }),
    async: true,
  });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
      currentTimeStamp: Date.now(),
    };
  }

  return redirectWithToast(request.url, {
    id: "update-web-social-toast",
    key: `${new Date().getTime()}`,
    message: locales.route.content.success,
  });
}

function WebSocial() {
  const location = useLocation();
  const { organization, currentTimestamp, locales } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isHydrated = useHydrated();

  const { organizationVisibility, ...rest } = organization;
  const [form, fields] = useForm({
    // Use different ids depending on loaderData to sync dirty state
    id: `web-social-form-${actionData?.currentTimeStamp || currentTimestamp}`,
    defaultValue: {
      ...rest,
      visibilities: organizationVisibility,
    },
    constraint: getZodConstraint(createWebSocialSchema(locales)),
    // Client side validation onInput, server side validation on submit
    shouldValidate: "onInput",
    onValidate: (values) => {
      return parseWithZod(values.formData, {
        schema: createWebSocialSchema(locales),
      });
    },
    shouldRevalidate: "onInput",
    lastResult: navigation.state === "idle" ? actionData?.submission : null,
  });
  const visibilities = fields.visibilities.getFieldset();

  const UnsavedChangesBlockerModal = useUnsavedChangesBlockerWithModal({
    searchParam: "modal-unsaved-changes",
    formMetadataToCheck: form,
    locales,
  });

  return (
    <Section>
      {UnsavedChangesBlockerModal}
      <BackButton to={location.pathname}>
        {locales.route.content.back}
      </BackButton>
      <p className="mv-my-6 @md:mv-mt-0">{locales.route.content.intro}</p>
      <Form
        {...getFormProps(form)}
        method="post"
        preventScrollReset
        autoComplete="off"
      >
        <button type="submit" hidden />
        <div className="mv-flex mv-flex-col mv-gap-6 @md:mv-gap-4">
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.form.website.headline}
            </h2>
            <Input
              {...getInputProps(fields.website, { type: "url" })}
              placeholder={locales.route.form.website.url.placeholder}
              key={"website"}
            >
              <Input.Label htmlFor={fields.website.id}>
                {locales.route.form.website.url.label}
              </Input.Label>
              <Input.Controls>
                <VisibilityCheckbox
                  {...getInputProps(visibilities.website, {
                    type: "checkbox",
                  })}
                  key={"website-visibility"}
                  errorMessage={
                    Array.isArray(visibilities.website.errors)
                      ? visibilities.website.errors.join(", ")
                      : undefined
                  }
                  errorId={visibilities.website.errorId}
                  locales={locales}
                />
              </Input.Controls>
              {typeof fields.website.errors !== "undefined" &&
              fields.website.errors.length > 0
                ? fields.website.errors.map((error) => (
                    <Input.Error id={fields.website.errorId} key={error}>
                      {error}
                    </Input.Error>
                  ))
                : null}
            </Input>
          </div>
          <div className="mv-flex mv-flex-col mv-gap-4 @md:mv-p-4 @md:mv-border @md:mv-rounded-lg @md:mv-border-gray-200">
            <h2 className="mv-text-primary mv-text-lg mv-font-semibold mv-mb-0">
              {locales.route.form.socialNetworks.headline}
            </h2>
            {Object.entries(organization).map(([key]) => {
              const typedKey = key as keyof typeof organization;
              if (
                typedKey === "website" ||
                typedKey === "organizationVisibility"
              ) {
                return null;
              }
              return (
                <Input
                  {...getInputProps(fields[typedKey], { type: "url" })}
                  placeholder={
                    locales.route.form.socialNetworks[typedKey].placeholder
                  }
                  key={key}
                >
                  <Input.Label htmlFor={fields[typedKey].id}>
                    {locales.route.form.socialNetworks[typedKey].label}
                  </Input.Label>
                  <Input.Controls>
                    <VisibilityCheckbox
                      {...getInputProps(visibilities[typedKey], {
                        type: "checkbox",
                      })}
                      key={`${key}-visibility`}
                      errorMessage={
                        Array.isArray(visibilities[typedKey].errors)
                          ? visibilities[typedKey].errors.join(", ")
                          : undefined
                      }
                      errorId={visibilities[typedKey].errorId}
                      locales={locales}
                    />
                  </Input.Controls>
                  {typeof fields[typedKey].errors !== "undefined" &&
                  fields[typedKey].errors.length > 0
                    ? fields[typedKey].errors.map((error) => (
                        <Input.Error id={fields[typedKey].errorId} key={error}>
                          {error}
                        </Input.Error>
                      ))
                    : null}
                </Input>
              );
            })}
          </div>
          {typeof form.errors !== "undefined" && form.errors.length > 0 ? (
            <div>
              {form.errors.map((error, index) => {
                return (
                  <div
                    id={form.errorId}
                    key={index}
                    className="mv-text-sm mv-font-semibold mv-text-negative-600"
                  >
                    {error}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="mv-flex mv-flex-col @xl:mv-flex-row mv-w-full mv-justify-end @xl:mv-justify-between mv-items-start @xl:mv-items-center mv-gap-4">
            <div className="mv-flex mv-flex-col mv-gap-1">
              <p className="mv-text-xs mv-flex mv-items-center mv-gap-1">
                <span className="mv-w-4 mv-h-4">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 10C20 10 16.25 3.125 10 3.125C3.75 3.125 0 10 0 10C0 10 3.75 16.875 10 16.875C16.25 16.875 20 10 20 10ZM1.46625 10C2.07064 9.0814 2.7658 8.22586 3.54125 7.44625C5.15 5.835 7.35 4.375 10 4.375C12.65 4.375 14.8488 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.0814 18.535 10C18.4625 10.1087 18.3825 10.2287 18.2913 10.36C17.8725 10.96 17.2538 11.76 16.46 12.5538C14.8488 14.165 12.6488 15.625 10 15.625C7.35 15.625 5.15125 14.165 3.54 12.5538C2.76456 11.7741 2.0694 10.9186 1.465 10H1.46625Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10 6.875C9.1712 6.875 8.37634 7.20424 7.79029 7.79029C7.20424 8.37634 6.875 9.1712 6.875 10C6.875 10.8288 7.20424 11.6237 7.79029 12.2097C8.37634 12.7958 9.1712 13.125 10 13.125C10.8288 13.125 11.6237 12.7958 12.2097 12.2097C12.7958 11.6237 13.125 10.8288 13.125 10C13.125 9.1712 12.7958 8.37634 12.2097 7.79029C11.6237 7.20424 10.8288 6.875 10 6.875ZM5.625 10C5.625 8.83968 6.08594 7.72688 6.90641 6.90641C7.72688 6.08594 8.83968 5.625 10 5.625C11.1603 5.625 12.2731 6.08594 13.0936 6.90641C13.9141 7.72688 14.375 8.83968 14.375 10C14.375 11.1603 13.9141 12.2731 13.0936 13.0936C12.2731 13.9141 11.1603 14.375 10 14.375C8.83968 14.375 7.72688 13.9141 6.90641 13.0936C6.08594 12.2731 5.625 11.1603 5.625 10Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>{locales.route.form.hint.public}</span>
              </p>
              <p className="mv-text-xs mv-flex mv-items-center mv-gap-1">
                <span className="mv-w-4 mv-h-4">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.6987 14.0475C18.825 12.15 20 10 20 10C20 10 16.25 3.125 10 3.125C8.79949 3.12913 7.61256 3.37928 6.5125 3.86L7.475 4.82375C8.28429 4.52894 9.13868 4.3771 10 4.375C12.65 4.375 14.8487 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.08141 18.535 10C18.4625 10.1088 18.3825 10.2288 18.2912 10.36C17.8725 10.96 17.2537 11.76 16.46 12.5538C16.2537 12.76 16.0387 12.9638 15.8137 13.1613L16.6987 14.0475Z"
                      fill="currentColor"
                    />
                    <path
                      d="M14.1212 11.47C14.4002 10.6898 14.4518 9.84643 14.2702 9.03803C14.0886 8.22962 13.6811 7.48941 13.0952 6.90352C12.5093 6.31764 11.7691 5.91018 10.9607 5.72854C10.1523 5.5469 9.30895 5.59856 8.52875 5.8775L9.5575 6.90625C10.0379 6.83749 10.5277 6.88156 10.9881 7.03495C11.4485 7.18835 11.8668 7.44687 12.21 7.79001C12.5531 8.13316 12.8116 8.55151 12.965 9.01191C13.1184 9.47231 13.1625 9.96211 13.0937 10.4425L14.1212 11.47ZM10.4425 13.0937L11.47 14.1212C10.6898 14.4002 9.84643 14.4518 9.03803 14.2702C8.22962 14.0886 7.48941 13.6811 6.90352 13.0952C6.31764 12.5093 5.91018 11.7691 5.72854 10.9607C5.5469 10.1523 5.59856 9.30895 5.8775 8.52875L6.90625 9.5575C6.83749 10.0379 6.88156 10.5277 7.03495 10.9881C7.18835 11.4485 7.44687 11.8668 7.79001 12.21C8.13316 12.5531 8.55151 12.8116 9.01191 12.965C9.47231 13.1184 9.96211 13.1625 10.4425 13.0937Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4.1875 6.8375C3.9625 7.0375 3.74625 7.24 3.54 7.44625C2.76456 8.22586 2.0694 9.08141 1.465 10L1.70875 10.36C2.1275 10.96 2.74625 11.76 3.54 12.5538C5.15125 14.165 7.35125 15.625 10 15.625C10.895 15.625 11.7375 15.4588 12.525 15.175L13.4875 16.14C12.3874 16.6207 11.2005 16.8708 10 16.875C3.75 16.875 0 10 0 10C0 10 1.17375 7.84875 3.30125 5.9525L4.18625 6.83875L4.1875 6.8375ZM17.0575 17.9425L2.0575 2.9425L2.9425 2.0575L17.9425 17.0575L17.0575 17.9425Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>{locales.route.form.hint.private}</span>
              </p>
            </div>
            <div className="mv-flex mv-shrink mv-w-full @xl:mv-max-w-fit @xl:mv-w-auto mv-items-center mv-justify-center @xl:mv-justify-end">
              <Controls>
                <div className="mv-relative mv-w-full">
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
                    {locales.route.form.reset}
                  </Button>
                  <noscript className="mv-absolute mv-top-0">
                    <Button
                      as="a"
                      href="./web-social"
                      variant="outline"
                      fullSize
                    >
                      {locales.route.form.reset}
                    </Button>
                  </noscript>
                </div>
                <Button
                  type="submit"
                  name="intent"
                  defaultValue="submit"
                  fullSize
                  // Don't disable button when js is disabled
                  disabled={
                    isHydrated
                      ? form.dirty === false || form.valid === false
                      : false
                  }
                >
                  {locales.route.form.submit}
                </Button>
              </Controls>
            </div>
          </div>
        </div>
      </Form>
    </Section>
  );
}

export default WebSocial;
