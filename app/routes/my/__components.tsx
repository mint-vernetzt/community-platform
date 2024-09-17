import { Avatar, Button } from "@mint-vernetzt/components";
import { Form, Link, useFetcher, useSearchParams } from "@remix-run/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useHydrated } from "remix-utils/use-hydrated";
import { Icon } from "../__components";
import {
  i18nNS as organizationsI18nNS,
  type action as invitesAction,
} from "./organizations";
import {
  GetOrganizationsToAdd,
  type loader as organizationsToAddLoader,
} from "./organizations/get-organizations-to-add";
import { type getOrganizationsToAdd } from "./organizations/get-organizations-to-add.server";
import {
  AddToOrganizationRequest,
  type action as requestsAction,
} from "./organizations/requests";

export function Section(props: { children: React.ReactNode }) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  const headline = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Section.Headline;
  });
  const subline = validChildren.find((child) => {
    return React.isValidElement(child) && child.type === Section.Subline;
  });

  const otherChildren = validChildren.filter((child) => {
    return (
      React.isValidElement(child) &&
      child.type !== Section.Headline &&
      child.type !== Section.Subline
    );
  });

  return (
    <section className="mv-w-full mv-flex mv-flex-col mv-gap-8 @sm:mv-px-4 @lg:mv-px-6 @sm:mv-py-6 @sm:mv-gap-6 @sm:mv-bg-white @sm:mv-rounded-2xl @sm:mv-border @sm:mv-border-neutral-200">
      {typeof headline !== "undefined" || typeof subline !== "undefined" ? (
        <div className="mv-flex mv-flex-col mv-gap-2">
          {headline}
          {subline}
        </div>
      ) : null}
      {otherChildren}
    </section>
  );
}

function SectionHeadline(props: React.PropsWithChildren<{ id?: string }>) {
  const { children, ...otherProps } = props;
  return (
    <h2
      className="mv-text-2xl mv-font-bold mv-text-primary mv-leading-[26px] mv-mb-0"
      {...otherProps}
    >
      {children}
    </h2>
  );
}

function SectionSubline(props: React.PropsWithChildren<{ id?: string }>) {
  const { children, ...otherProps } = props;

  return (
    <p className="mv-text-base mv-text-neutral-600" {...otherProps}>
      {props.children}
    </p>
  );
}

Section.Headline = SectionHeadline;
Section.Subline = SectionSubline;

export function AddOrganization(props: {
  organizations?: Awaited<ReturnType<typeof getOrganizationsToAdd>>;
  createRequestFetcher: ReturnType<typeof useFetcher<typeof requestsAction>>;
}) {
  const { organizations = [], createRequestFetcher } = props;

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
      {searchQuery.length > 3 && Array.isArray(data) && data.length === 0 ? (
        <CreateOrganization name={searchQuery} />
      ) : null}
      {Array.isArray(data) && data.length > 0 ? (
        <>
          {/* TODO: 
            Is this toast necessary? 
            - When i find organizations i already see a list of organizations which makes this toast obsolete.
            - It creates a layout shift when the toast is shown/hidden for elements that want to be clicked
          */}
          {/* <Toast level="neutral" delay={5000}>
            {t("addOrganization.toasts.organizationsFound")}
          </Toast> */}
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

export function AcceptOrRejectInviteFetcher(props: {
  inviteFetcher: ReturnType<typeof useFetcher<typeof invitesAction>>;
  organizationId: string;
  tabKey: string;
}) {
  const { inviteFetcher, organizationId, tabKey } = props;
  const { t } = useTranslation(organizationsI18nNS);

  return (
    <inviteFetcher.Form
      id={`invite-form-${organizationId}`}
      method="post"
      className="mv-grid mv-grid-cols-2 mv-grid-rows-1 mv-gap-4 mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
      preventScrollReset
    >
      <input
        type="hidden"
        required
        readOnly
        name="organizationId"
        defaultValue={organizationId}
      />
      <input
        type="hidden"
        required
        readOnly
        name="role"
        defaultValue={tabKey === "teamMember" ? "member" : "admin"}
      />
      <Button
        id={`reject-invite-${organizationId}`}
        variant="outline"
        fullSize
        type="submit"
        name="intent"
        value="rejected"
        aria-describedby={`invites-headline tab-description-${tabKey} reject-invite-${organizationId} invites-subline`}
      >
        {t("invites.decline")}
      </Button>
      <Button
        id={`accept-invite-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value="accepted"
        aria-describedby={`invites-headline tab-description-${tabKey} accept-invite-${organizationId} invites-subline`}
      >
        {t("invites.accept")}
      </Button>
    </inviteFetcher.Form>
  );
}

export function CancelRequestFetcher(props: {
  fetcher: ReturnType<typeof useFetcher<typeof requestsAction>>;
  organizationId: string;
}) {
  const { fetcher, organizationId } = props;
  const { t } = useTranslation(organizationsI18nNS);

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get(GetOrganizationsToAdd.SearchParam) ?? "";

  return (
    <fetcher.Form
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
        defaultValue={organizationId}
      />
      <input
        type="hidden"
        name={GetOrganizationsToAdd.SearchParam}
        value={searchQuery}
      />
      <input
        type="hidden"
        name="intent"
        value={AddToOrganizationRequest.Cancel}
      />
      <Button
        variant="outline"
        fullSize
        type="submit"
        disabled={fetcher.state === "submitting"}
      >
        {t("addOrganization.cancelRequest")}
      </Button>
    </fetcher.Form>
  );
}

export function AcceptOrRejectRequestFetcher(props: {
  fetcher: ReturnType<typeof useFetcher<typeof requestsAction>>;
  profileId: string;
  organizationId: string;
  tabKey: string;
}) {
  const { fetcher, profileId, organizationId, tabKey } = props;
  const { t } = useTranslation(organizationsI18nNS);

  return (
    <fetcher.Form
      preventScrollReset
      method="post"
      className="mv-grid mv-grid-cols-2 mv-grid-rows-1 mv-gap-4 mv-w-full @sm:mv-w-fit @sm:mv-min-w-fit"
      action="/my/organizations/requests"
    >
      <input
        type="hidden"
        required
        readOnly
        name="organizationId"
        defaultValue={organizationId}
      />
      <input
        type="hidden"
        required
        readOnly
        name="profileId"
        defaultValue={profileId}
      />
      <Button
        id={`reject-request-${profileId}-${organizationId}`}
        variant="outline"
        fullSize
        type="submit"
        name="intent"
        value={AddToOrganizationRequest.Reject}
        aria-describedby={`requests-headline tab-description-${tabKey} reject-request-${profileId}-${organizationId} requests-subline`}
      >
        {t("requests.decline")}
      </Button>
      <Button
        id={`accept-request-${profileId}-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value={AddToOrganizationRequest.Accept}
        aria-describedby={`requests-headline tab-description-${tabKey} accept-request-${profileId}-${organizationId} requests-subline`}
      >
        {t("requests.accept")}
      </Button>
    </fetcher.Form>
  );
}

type Entity =
  | {
      logo: string | null;
      id: string;
      name: string;
      slug: string;
      types: {
        organizationType: {
          title: string;
        };
      }[];
    }
  | {
      avatar: string | null;
      id: string;
      academicTitle: string | null;
      firstName: string;
      lastName: string;
      username: string;
      position: string | null;
    };

export function ListItem(
  props: React.PropsWithChildren<{
    entity: Entity;
    listIndex: number;
  }>
) {
  const { entity, children, listIndex } = props;

  return (
    <li
      className={`mv-flex-col @sm:mv-flex-row mv-gap-4 mv-p-4 mv-border mv-border-neutral-200 mv-rounded-2xl mv-justify-between mv-items-center ${
        listIndex > 2 ? "mv-hidden group-has-[:checked]:mv-flex" : "mv-flex"
      }`}
    >
      <Link
        to={
          "academicTitle" in entity
            ? `/profile/${entity.username}`
            : `/organization/${entity.slug}`
        }
        className="mv-flex mv-gap-2 @sm:mv-gap-4 mv-items-center mv-w-full @sm:mv-w-fit"
      >
        <div className="mv-h-[72px] mv-w-[72px] mv-min-h-[72px] mv-min-w-[72px]">
          <Avatar size="full" {...entity} />
        </div>
        <div>
          <p className="mv-text-primary mv-text-sm mv-font-bold mv-line-clamp-2">
            {"academicTitle" in entity
              ? `${entity.academicTitle ? `${entity.academicTitle} ` : ""}${
                  entity.firstName
                } ${entity.lastName}`
              : entity.name}
          </p>
          <p className="mv-text-neutral-700 mv-text-sm mv-line-clamp-1">
            {"academicTitle" in entity
              ? entity.position
              : entity.types
                  .map((relation) => {
                    return relation.organizationType.title;
                  })
                  .join(", ")}
          </p>
        </div>
      </Link>
      {children}
    </li>
  );
}

export function ListContainer(
  props: React.PropsWithChildren<{ listKey: string }>
) {
  const { children, listKey } = props;
  const { t } = useTranslation(organizationsI18nNS);
  return (
    <ul className="mv-flex mv-flex-col mv-gap-4 mv-group">
      {children}
      {children !== undefined &&
      Array.isArray(children) &&
      children.length > 3 ? (
        <div
          key={`show-more-${listKey}-container`}
          className="mv-w-full mv-flex mv-justify-center mv-pt-2 mv-text-sm mv-text-neutral-600 mv-font-semibold mv-leading-5 mv-justify-self-center"
        >
          <label
            htmlFor={`show-more-${listKey}`}
            className="mv-flex mv-gap-2 mv-cursor-pointer mv-w-fit"
          >
            <div className="group-has-[:checked]:mv-hidden">
              {t("invites.more", {
                count: children.length - 3,
              })}
            </div>
            <div className="mv-hidden group-has-[:checked]:mv-block">
              {t("invites.less", {
                count: children.length - 3,
              })}
            </div>
            <div className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90">
              <Icon type="chevron-right" />
            </div>
          </label>
          <input
            id={`show-more-${listKey}`}
            type="checkbox"
            className="mv-w-0 mv-h-0 mv-opacity-0"
          />
        </div>
      ) : null}
    </ul>
  );
}

export function CreateOrganization(props: { name: string }) {
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
