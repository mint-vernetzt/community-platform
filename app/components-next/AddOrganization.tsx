import { Form, useFetcher, useSearchParams } from "react-router";
import {
  type MyOrganizationsLocales,
  type addImageUrlToOrganizationMemberInvites,
  type flattenOrganizationRelations,
} from "~/routes/my/organizations.server";
import { type getOrganizationsToAdd } from "~/routes/my/organizations/get-organizations-to-add.server";
import { type getPendingRequestsToOrganizations } from "~/routes/my/organizations/requests.server";
import {
  AddMemberToOrganizationRequest,
  type action as requestsAction,
} from "~/routes/my/organizations/requests";
import {
  GetOrganizationsToAdd,
  type loader as organizationsToAddLoader,
} from "~/routes/my/organizations/get-organizations-to-add";
import { useHydrated } from "remix-utils/use-hydrated";
import React from "react";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { ListContainer } from "./ListContainer";
import { ListItem } from "./ListItem";
import { Input } from "@mint-vernetzt/components/src/molecules/Input";

export function AddOrganization(props: {
  organizations?: Awaited<ReturnType<typeof getOrganizationsToAdd>>;
  memberOrganizations: Awaited<ReturnType<typeof flattenOrganizationRelations>>;
  pendingRequestsToOrganizations: Awaited<
    ReturnType<typeof getPendingRequestsToOrganizations>
  >;
  invites: ReturnType<typeof addImageUrlToOrganizationMemberInvites>;
  createRequestFetcher: ReturnType<typeof useFetcher<typeof requestsAction>>;
  locales: MyOrganizationsLocales;
}) {
  const {
    organizations = [],
    createRequestFetcher,
    memberOrganizations,
    pendingRequestsToOrganizations,
    invites,
    locales,
  } = props;

  const [searchParams] = useSearchParams();
  const getOrganizationsToAddFetcher =
    useFetcher<typeof organizationsToAddLoader>();
  const isHydrated = useHydrated();

  const [searchQuery, setSearchQuery] = React.useState(
    searchParams.get(GetOrganizationsToAdd.SearchParam) ?? ""
  );

  const handleFormActions = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector(
      'input[name="add-organization"]'
    ) as HTMLInputElement | null;
    if (input === null) {
      return;
    }
    setSearchQuery(input.value);
    if (input.value.length >= 3) {
      getOrganizationsToAddFetcher.submit(event.currentTarget);
    } else {
      setData([]);
    }
  };

  const [data, setData] = React.useState(organizations);

  React.useEffect(() => {
    if (Array.isArray(getOrganizationsToAddFetcher.data)) {
      setData(getOrganizationsToAddFetcher.data);
    } else {
      setData(organizations);
    }
  }, [getOrganizationsToAddFetcher.data, organizations]);

  return (
    <>
      <getOrganizationsToAddFetcher.Form
        method="get"
        action="/my/organizations/get-organizations-to-add"
        onChange={handleFormActions}
        onSubmit={handleFormActions}
      >
        {isHydrated === false ? <input type="hidden" name="no-js" /> : null}
        <div className="mv-w-full">
          <Input
            id="request-to-add-to-organization"
            placeholder={
              locales.route.requestOrganizationMembership.placeholder
            }
            name={GetOrganizationsToAdd.SearchParam}
            minLength={3}
            defaultValue={
              searchParams.get(GetOrganizationsToAdd.SearchParam) ?? ""
            }
            autoComplete="off"
          >
            <Input.Label htmlFor="request-to-add-to-organization">
              {locales.route.requestOrganizationMembership.label}
            </Input.Label>
            <Input.SearchIcon />

            <Input.HelperText>
              {locales.route.requestOrganizationMembership.helperText}
            </Input.HelperText>
            {isHydrated === false ? (
              <Input.Controls>
                <noscript>
                  <Button type="submit" variant="outline">
                    {locales.route.requestOrganizationMembership.searchCta}
                  </Button>
                </noscript>
              </Input.Controls>
            ) : null}
          </Input>
        </div>
      </getOrganizationsToAddFetcher.Form>
      {searchQuery.length >= 3 &&
      Array.isArray(data) &&
      data.length === 0 &&
      memberOrganizations.adminOrganizations.some((organization) => {
        const searchQueryWords = searchQuery.split(" ");
        return searchQueryWords.some((word) => {
          return organization.name.toLowerCase().includes(word.toLowerCase());
        });
      }) === false &&
      memberOrganizations.teamMemberOrganizations.some((organization) => {
        const searchQueryWords = searchQuery.split(" ");
        return searchQueryWords.some((word) => {
          return organization.name.toLowerCase().includes(word.toLowerCase());
        });
      }) === false &&
      pendingRequestsToOrganizations.some((organization) => {
        const searchQueryWords = searchQuery.split(" ");
        return searchQueryWords.some((word) => {
          return organization.name.toLowerCase().includes(word.toLowerCase());
        });
      }) === false &&
      invites.adminInvites.some((invite) => {
        const searchQueryWords = searchQuery.split(" ");
        return searchQueryWords.some((word) => {
          return invite.organization.name
            .toLowerCase()
            .includes(word.toLowerCase());
        });
      }) === false &&
      invites.teamMemberInvites.some((invite) => {
        const searchQueryWords = searchQuery.split(" ");
        return searchQueryWords.some((word) => {
          return invite.organization.name
            .toLowerCase()
            .includes(word.toLowerCase());
        });
      }) === false ? (
        <CreateOrganization name={searchQuery} locales={locales} />
      ) : null}
      {Array.isArray(data) && data.length > 0 ? (
        <>
          <ListContainer
            listKey="send-request-to-organization"
            locales={locales}
            hideAfter={3}
          >
            {data.map((organization, index) => {
              if (organization === null) {
                return null;
              }
              return (
                <ListItem
                  key={`send-request-to-${organization.id}`}
                  listIndex={index}
                  entity={organization}
                  hideAfter={3}
                  locales={locales}
                >
                  <createRequestFetcher.Form
                    preventScrollReset
                    method="post"
                    className="mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
                    action="/my/organizations/requests"
                  >
                    <input
                      type="hidden"
                      required
                      readOnly
                      name="organizationId"
                      defaultValue={organization.id}
                    />
                    <input
                      type="hidden"
                      name={GetOrganizationsToAdd.SearchParam}
                      value={searchQuery}
                    />
                    <input
                      type="hidden"
                      name="intent"
                      value={AddMemberToOrganizationRequest.Create}
                    />
                    <Button
                      variant="outline"
                      fullSize
                      type="submit"
                      disabled={createRequestFetcher.state === "submitting"}
                    >
                      {
                        locales.route.requestOrganizationMembership
                          .createOrganizationMemberRequestCta
                      }
                    </Button>
                  </createRequestFetcher.Form>
                </ListItem>
              );
            })}
          </ListContainer>
        </>
      ) : null}
    </>
  );
}

function CreateOrganization(props: {
  name: string;
  locales: MyOrganizationsLocales;
}) {
  const { locales } = props;
  return (
    <div className="mv-flex mv-flex-col mv-gap-4 mv-group">
      <div className="mv-flex-col @sm:mv-flex-row mv-gap-4 mv-p-4 mv-border mv-border-neutral-200 mv-rounded-2xl mv-justify-between mv-items-center mv-flex">
        <div className="mv-flex mv-gap-2 @sm:mv-gap-4 mv-items-center mv-w-full @sm:mv-w-fit">
          <div className="mv-h-[72px] mv-w-[72px] mv-min-h-[72px] mv-min-w-[72px]">
            <Avatar size="full" name={props.name} />
          </div>
          <p className="mv-text-primary mv-text-sm mv-font-bold mv-line-clamp-2">
            {props.name}
          </p>
        </div>
        <Form method="get" action="/organization/create">
          <input type="hidden" name="search" value={props.name} />
          <Button type="submit">
            {locales.route.requestOrganizationMembership.create}
          </Button>
        </Form>
      </div>
    </div>
  );
}
