import { Avatar, Button as LegacyButton } from "@mint-vernetzt/components";
import { Form, Link, useFetcher, useSearchParams } from "@remix-run/react";
import classNames from "classnames";
import React from "react";
import { useTranslation } from "react-i18next";
import { useHydrated } from "remix-utils/use-hydrated";
import { Icon } from "../__components";
import {
  i18nNS as organizationsI18nNS,
  type action as invitesAction,
} from "./organizations";
import {
  type addImageUrlToInvites,
  type flattenOrganizationRelations,
} from "./organizations.server";
import {
  GetOrganizationsToAdd,
  type loader as organizationsToAddLoader,
} from "./organizations/get-organizations-to-add";
import { type getOrganizationsToAdd } from "./organizations/get-organizations-to-add.server";
import {
  AddToOrganizationRequest,
  type action as requestsAction,
} from "./organizations/requests";
import { type getPendingRequestsToOrganizations } from "./organizations/requests.server";
import { type Jsonify } from "@remix-run/server-runtime/dist/jsonify";

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
                    <LegacyButton
                      variant="outline"
                      fullSize
                      type="submit"
                      disabled={createRequestFetcher.state === "submitting"}
                    >
                      {t("addOrganization.createRequest")}
                    </LegacyButton>
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
      <LegacyButton
        id={`reject-invite-${organizationId}`}
        variant="outline"
        fullSize
        type="submit"
        name="intent"
        value="rejected"
        aria-describedby={`invites-headline tab-description-${tabKey} reject-invite-${organizationId} invites-subline`}
      >
        {t("invites.decline")}
      </LegacyButton>
      <LegacyButton
        id={`accept-invite-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value="accepted"
        aria-describedby={`invites-headline tab-description-${tabKey} accept-invite-${organizationId} invites-subline`}
      >
        {t("invites.accept")}
      </LegacyButton>
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
      <LegacyButton
        variant="outline"
        fullSize
        type="submit"
        disabled={fetcher.state === "submitting"}
      >
        {t("addOrganization.cancelRequest")}
      </LegacyButton>
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
      <LegacyButton
        id={`reject-request-${profileId}-${organizationId}`}
        variant="outline"
        fullSize
        type="submit"
        name="intent"
        value={AddToOrganizationRequest.Reject}
        aria-describedby={`requests-headline tab-description-${tabKey} reject-request-${profileId}-${organizationId} requests-subline`}
      >
        {t("requests.decline")}
      </LegacyButton>
      <LegacyButton
        id={`accept-request-${profileId}-${organizationId}`}
        fullSize
        type="submit"
        name="intent"
        value={AddToOrganizationRequest.Accept}
        aria-describedby={`requests-headline tab-description-${tabKey} accept-request-${profileId}-${organizationId} requests-subline`}
      >
        {t("requests.accept")}
      </LegacyButton>
    </fetcher.Form>
  );
}

type ListOrganization = {
  logo: string | null;
  name: string;
  slug: string;
  types: {
    organizationType: {
      slug: string;
    };
  }[];
};

type ListProfile = {
  avatar: string | null;
  academicTitle: string | null;
  firstName: string;
  lastName: string;
  username: string;
  position: string | null;
};

type ListProject = {
  logo: string | null;
  name: string;
  slug: string;
  responsibleOrganizations: {
    organization: {
      name: string;
      slug: string;
    };
  }[];
};

type Entity = ListOrganization | ListProfile | ListProject;

export function ListItem(
  props: React.PropsWithChildren<{
    entity: Entity;
    listIndex: number;
    hideAfter?: number;
  }>
) {
  const { entity, children, listIndex, hideAfter } = props;
  const { t } = useTranslation(organizationsI18nNS);

  return (
    <li
      className={`mv-flex-col @sm:mv-flex-row mv-gap-4 mv-p-4 mv-border mv-border-neutral-200 mv-rounded-2xl mv-justify-between mv-items-center ${
        hideAfter !== undefined && listIndex > hideAfter - 1
          ? "mv-hidden group-has-[:checked]:mv-flex"
          : "mv-flex"
      }`}
    >
      <Link
        to={
          "academicTitle" in entity
            ? `/profile/${entity.username}`
            : "responsibleOrganizations" in entity
            ? `/project/${entity.slug}`
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
              : "responsibleOrganizations" in entity
              ? entity.responsibleOrganizations
                  .map((relation) => relation.organization.name)
                  .join(", ")
              : entity.types
                  .map((relation) => {
                    return t(`${relation.organizationType.slug}.title`, {
                      ns: "datasets/organizationTypes",
                    });
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
  props: React.PropsWithChildren<{ listKey: string; hideAfter?: number }>
) {
  const { children, listKey, hideAfter } = props;
  const { t } = useTranslation("components");
  return (
    <ul className="mv-flex mv-flex-col mv-gap-4 @lg:mv-gap-6 mv-group">
      {children}
      {children !== undefined &&
      Array.isArray(children) &&
      hideAfter !== undefined &&
      children.length > hideAfter ? (
        <div
          key={`show-more-${listKey}-container`}
          className="mv-w-full mv-flex mv-justify-center mv-pt-2 mv-text-sm mv-text-neutral-600 mv-font-semibold mv-leading-5 mv-justify-self-center"
        >
          <label
            htmlFor={`show-more-${listKey}`}
            className="mv-flex mv-gap-2 mv-cursor-pointer mv-w-fit"
          >
            <div className="group-has-[:checked]:mv-hidden">
              {t("ListContainer.more", {
                count: children.length - 3,
              })}
            </div>
            <div className="mv-hidden group-has-[:checked]:mv-block">
              {t("ListContainer.less", {
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
          <LegacyButton type="submit">
            {t("addOrganization.create")}
          </LegacyButton>
        </Form>
      </div>
    </div>
  );
}

export function Container(props: { children: React.ReactNode }) {
  return (
    <div className="mv-w-full mv-h-full mv-flex mv-justify-center">
      <div className="mv-w-full mv-py-6 mv-px-4 @lg:mv-py-8 @md:mv-px-6 @lg:mv-px-8 mv-flex mv-flex-col mv-gap-6 mv-mb-10 @sm:mv-mb-[72px] @lg:mv-mb-16 mv-max-w-screen-2xl">
        {props.children}
      </div>
    </div>
  );
}

export function ContainerHeader(props: { children: React.ReactNode }) {
  return (
    <div className="mv-flex mv-flex-col @sm:mv-flex-row mv-gap-4 @md:mv-gap-6 @lg:mv-gap-8 mv-items-center mv-justify-between">
      {props.children}
    </div>
  );
}

export function ContainerTitle(props: { children: React.ReactNode }) {
  return (
    <h1 className="mv-mb-0 mv-text-5xl mv-text-primary mv-font-bold mv-leading-9">
      {props.children}
    </h1>
  );
}

Container.Header = ContainerHeader;
Container.Title = ContainerTitle;

type ButtonProps = React.PropsWithChildren<{
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}>;

export function Button(props: ButtonProps) {
  const { variant = "primary" } = props;

  const classes = classNames(
    "mv-font-semibold",
    "mv-inline-flex mv-rounded-lg mv-shrink-0 mv-cursor-pointer mv-user-select-none mv-flex-wrap mv-align-center mv-justify-center mv-px-4 mv-text-sm mv-text-center mv-leading-5",
    "mv-whitespace-nowrap",
    "mv-h-10 mv-text-sm mv-px-6 mv-py-2.5 mv-border",
    variant === "primary" &&
      "mv-bg-primary mv-text-neutral-50 hover:mv-bg-primary-600 focus:mv-bg-primary-600 active:mv-bg-primary-700 mv-border-transparent",
    variant === "secondary" &&
      "mv-bg-neutral-50 mv-text-primary hover:mv-bg-primary-50 focus:mv-bg-primary-100 active:mv-bg-primary-100 mv-border-primary",
    "mv-gap-2"
  );

  if (React.isValidElement(props.children)) {
    return React.cloneElement(props.children as React.ReactElement, {
      className: classes,
    });
  }

  return <button className={classes}>{props.children}</button>;
}

export function AddIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 5C10.1658 5 10.3247 5.06585 10.4419 5.18306C10.5592 5.30027 10.625 5.45924 10.625 5.625V9.375H14.375C14.5408 9.375 14.6997 9.44085 14.8169 9.55806C14.9342 9.67527 15 9.83424 15 10C15 10.1658 14.9342 10.3247 14.8169 10.4419C14.6997 10.5592 14.5408 10.625 14.375 10.625H10.625V14.375C10.625 14.5408 10.5592 14.6997 10.4419 14.8169C10.3247 14.9342 10.1658 15 10 15C9.83424 15 9.67527 14.9342 9.55806 14.8169C9.44085 14.6997 9.375 14.5408 9.375 14.375V10.625H5.625C5.45924 10.625 5.30027 10.5592 5.18306 10.4419C5.06585 10.3247 5 10.1658 5 10C5 9.83424 5.06585 9.67527 5.18306 9.55806C5.30027 9.44085 5.45924 9.375 5.625 9.375H9.375V5.625C9.375 5.45924 9.44085 5.30027 9.55806 5.18306C9.67527 5.06585 9.83424 5 10 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Placeholder(props: { children: React.ReactNode }) {
  const validChildren = React.Children.toArray(props.children).filter(
    (child) => {
      return React.isValidElement(child);
    }
  );

  const title = validChildren.find((child) => {
    return (child as React.ReactElement).type === PlaceholderTitle;
  });
  const text = validChildren.find((child) => {
    return (child as React.ReactElement).type === PlaceholderText;
  });
  const button = validChildren.find((child) => {
    return (child as React.ReactElement).type === Button;
  });

  return (
    <div className="mv-relative mv-flex mv-flex-col mv-gap-6 mv-h-[320px] mv-p-6 mv-border mv-border-secondary-50 mv-rounded-2xl mv-bg-secondary-50 mv-justify-center mv-overflow-hidden">
      <div className="mv-absolute mv-text-secondary-300 mv--bottom-8 @md:mv-bottom-0 mv--left-16 @md:mv-left-0">
        <svg
          width="288"
          height="172"
          viewBox="0 0 288 172"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M237.891 270.146C225.407 316.735 209.62 328.325 188.623 346.218C167.627 364.111 135.764 364.881 119.373 363.497C96.9684 361.606 45.622 341.543 26.0662 334.992C-8.9733 323.253 -93.3778 276.911 -79.3246 179.84C-58.611 36.7631 75.1117 24.4223 109.818 39.5964C151.59 57.8597 143.924 79.304 165.974 102.249C189.355 126.578 222.124 131.668 236.824 153.543C256.564 182.918 250.374 223.557 237.891 270.146Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="mv-absolute mv-text-primary-600 mv--bottom-8 @md:mv-bottom-0 mv--left-16 @md:mv-left-0">
        <svg
          width="306"
          height="104"
          viewBox="0 0 306 104"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M304.876 181.101C304.765 226.695 293.15 241.112 278.304 262.55C263.458 283.989 234.531 292.417 219.22 295.126C198.291 298.83 146.514 292.947 127.058 291.702C92.197 289.471 3.84401 267.591 -6.8486 175.493C-22.6089 39.7448 96.5788 -3.94874 131.968 1.50174C174.561 8.06181 172.756 29.5135 198.465 45.1319C225.725 61.6928 256.9 58.3992 275.634 74.8225C300.791 96.8764 304.988 135.507 304.876 181.101Z"
            stroke="currentColor"
            strokeWidth="1.0728"
          />
        </svg>
      </div>
      <div className="mv-absolute mv-text-negative-100 mv--top-16 @md:mv-top-0 mv--right-20 @md:mv-right-0">
        <svg
          width="239"
          height="195"
          viewBox="0 0 239 195"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.788445 -6.06951C0.912543 -56.8526 13.8496 -72.9101 30.3856 -96.7889C46.9215 -120.668 79.1399 -130.055 96.194 -133.073C119.505 -137.198 177.176 -130.645 198.846 -129.258C237.674 -126.773 336.084 -102.403 347.993 0.177393C365.547 151.376 232.794 200.042 193.377 193.972C145.936 186.665 147.947 162.772 119.311 145.375C88.9482 126.93 54.2253 130.598 33.359 112.306C5.33892 87.7416 0.664347 44.7136 0.788445 -6.06951Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="mv-absolute mv-text-negative-500 mv--top-16 @md:mv-top-0 mv--right-20 @md:mv-right-0">
        <svg
          width="191"
          height="189"
          viewBox="0 0 191 189"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.40783 -12.1266C1.53193 -62.9098 14.469 -78.9673 31.0049 -102.846C47.5409 -126.725 79.7593 -136.112 96.8133 -139.13C120.124 -143.255 177.795 -136.702 199.466 -135.315C238.294 -132.831 336.703 -108.46 348.613 -5.87974C366.167 145.319 233.413 193.985 193.996 187.914C146.555 180.608 148.566 156.714 119.931 139.318C89.5676 120.873 54.8447 124.541 33.9784 106.248C5.9583 81.6844 1.28373 38.6565 1.40783 -12.1266Z"
            stroke="currentColor"
            strokeWidth="1.1949"
          />
        </svg>
      </div>
      <div className="mv-flex mv-flex-col mv-gap-2 mv-z-10">
        {title}
        {text}
      </div>
      <div className="mv-text-center mv-z-10">{button}</div>
    </div>
  );
}

function PlaceholderTitle(props: { children: React.ReactNode }) {
  return (
    <h2 className="mv-text-xl mv-text-neutral-700 mv-font-bold mv-leading-6 mv-text-center mv-mb-0">
      {props.children}
    </h2>
  );
}

function PlaceholderText(props: { children: React.ReactNode }) {
  return (
    <p className="mv-text-lg mv-text-neutral-700 mv-font-normal mv-text-center">
      {props.children}
    </p>
  );
}

Placeholder.Title = PlaceholderTitle;
Placeholder.Text = PlaceholderText;
