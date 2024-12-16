import { Form, useFetcher, useSearchParams } from "@remix-run/react";
import { type Jsonify } from "@remix-run/server-runtime/dist/jsonify";
import {
  type addImageUrlToInvites,
  type flattenOrganizationRelations,
} from "~/routes/my/organizations.server";
import { type getOrganizationsToAdd } from "~/routes/my/organizations/get-organizations-to-add.server";
import { type getPendingRequestsToOrganizations } from "~/routes/my/organizations/requests.server";
import {
  AddToOrganizationRequest,
  type action as requestsAction,
} from "~/routes/my/organizations/requests";
import {
  GetOrganizationsToAdd,
  type loader as organizationsToAddLoader,
} from "~/routes/my/organizations/get-organizations-to-add";
import { useHydrated } from "remix-utils/use-hydrated";
import { useTranslation } from "react-i18next";
import { i18nNS as organizationsI18nNS } from "~/routes/my/organizations";
import React from "react";
import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { ListContainer } from "./ListContainer";
import { ListItem } from "./ListItem";

export function AddOrganization(props: {
  organizations?: Jsonify<Awaited<ReturnType<typeof getOrganizationsToAdd>>>;
  memberOrganizations: Awaited<ReturnType<typeof flattenOrganizationRelations>>;
  pendingRequestsToOrganizations: Jsonify<
    Awaited<ReturnType<typeof getPendingRequestsToOrganizations>>
  >;
  invites: Jsonify<ReturnType<typeof addImageUrlToInvites>>;
  createRequestFetcher: ReturnType<typeof useFetcher<typeof requestsAction>>;
}) {
  const {
    organizations = [],
    createRequestFetcher,
    memberOrganizations,
    pendingRequestsToOrganizations,
    invites,
  } = props;

  const [searchParams] = useSearchParams();
  const getOrganizationsToAddFetcher =
    useFetcher<typeof organizationsToAddLoader>();
  const isHydrated = useHydrated();

  const { t } = useTranslation(organizationsI18nNS);

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
    if (input.value.length > 3) {
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
        <div className="mv-w-full">
          <div className="mv-relative">
            <div className="mv-absolute mv-left-3.5 mv-top-3.5 mv-text-neutral-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                <path
                  fill="currentColor"
                  fillRule="nonzero"
                  d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1ZM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"
                />
              </svg>
            </div>
            {isHydrated === false ? <input type="hidden" name="no-js" /> : null}
            <input
              className="mv-w-full mv-font-semibold mv-bg-white mv-border-2 mv-border-gray-100 mv-rounded-lg mv-pl-10 mv-pr-4 mv-py-2 mv-h-11"
              placeholder="Organisation suchen..."
              name={GetOrganizationsToAdd.SearchParam}
              minLength={3}
              defaultValue={
                searchParams.get(GetOrganizationsToAdd.SearchParam) ?? ""
              }
              autoComplete="off"
            />
          </div>
        </div>
      </getOrganizationsToAddFetcher.Form>
      {searchQuery.length > 3 &&
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
        <CreateOrganization name={searchQuery} />
      ) : null}
      {Array.isArray(data) && data.length > 0 ? (
        <>
          <ListContainer listKey="send-request-to-organization">
            {data.map((organization, index) => {
              if (organization === null) {
                return null;
              }
              return (
                <ListItem
                  key={`send-request-to-${organization.id}`}
                  listIndex={index}
                  entity={organization}
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
                      value={AddToOrganizationRequest.Create}
                    />
                    <Button
                      variant="outline"
                      fullSize
                      type="submit"
                      disabled={createRequestFetcher.state === "submitting"}
                    >
                      {t("addOrganization.createRequest")}
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

function CreateOrganization(props: { name: string }) {
  const { t } = useTranslation(organizationsI18nNS);
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
          <Button type="submit">{t("addOrganization.create")}</Button>
        </Form>
      </div>
    </div>
  );
}
