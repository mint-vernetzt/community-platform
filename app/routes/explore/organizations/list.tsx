import { getZodConstraint } from "@conform-to/zod-v1";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { CardContainer } from "@mint-vernetzt/components/src/organisms/containers/CardContainer";
import { data, useNavigation, useRouteLoaderData } from "react-router";
import { ConformForm } from "~/components-next/ConformForm";
import { HiddenFilterInputsInContext } from "~/components-next/HiddenFilterInputs";
import { OrganizationCard } from "@mint-vernetzt/components/src/organisms/cards/OrganizationCard";
import { getFilterSchemes } from "../all.shared";
import { type loader as parentLoader } from "../organizations";
import { VIEW_COOKIE_VALUES, viewCookie } from "../organizations.server";

export async function loader() {
  const viewCookieHeader = {
    "Set-Cookie": await viewCookie.serialize(VIEW_COOKIE_VALUES.list),
  };
  return data(null, {
    headers: viewCookieHeader,
  });
}

export default function ExploreOrganizationsList() {
  const parentLoaderData = useRouteLoaderData<typeof parentLoader>(
    "routes/explore/organizations"
  );
  const navigation = useNavigation();

  let showMore = false;
  if (typeof parentLoaderData !== "undefined") {
    if (typeof parentLoaderData.filteredByVisibilityCount !== "undefined") {
      showMore =
        parentLoaderData.filteredByVisibilityCount >
        parentLoaderData.organizations.length;
    } else {
      showMore =
        parentLoaderData.organizationsCount >
        parentLoaderData.organizations.length;
    }
  }

  return typeof parentLoaderData !== "undefined" ? (
    <>
      <CardContainer type="multi row">
        {parentLoaderData.organizations.map((organization) => {
          return (
            <OrganizationCard
              locales={parentLoaderData.locales}
              key={`organization-${organization.id}`}
              publicAccess={!parentLoaderData.isLoggedIn}
              organization={organization}
              as="h2"
            />
          );
        })}
      </CardContainer>
      {showMore && (
        <div className="mv-w-full mv-flex mv-justify-center mv-mb-10 mv-mt-4 @lg:mv-mb-12 @lg:mv-mt-6 @xl:mv-mb-14 @xl:mv-mt-8">
          <ConformForm
            useFormOptions={{
              id: "load-more-organizations",
              defaultValue: {
                ...parentLoaderData.submission.value,
                orgPage: parentLoaderData.submission.value.orgPage + 1,
                search: [parentLoaderData.submission.value.search.join(" ")],
                showFilters: "",
              },
              constraint: getZodConstraint(getFilterSchemes),
              lastResult:
                navigation.state === "idle"
                  ? parentLoaderData.submission
                  : null,
            }}
            formProps={{
              method: "get",
              preventScrollReset: true,
              replace: true,
            }}
          >
            <HiddenFilterInputsInContext />
            <Button
              type="submit"
              size="large"
              variant="outline"
              loading={navigation.state === "loading"}
              disabled={navigation.state === "loading"}
            >
              {parentLoaderData.locales.route.more}
            </Button>
          </ConformForm>
        </div>
      )}
    </>
  ) : null;
}
