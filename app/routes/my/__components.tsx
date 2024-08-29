import { Avatar } from "@mint-vernetzt/components";
import { Link, useFetcher, useSearchParams } from "@remix-run/react";
import React from "react";
import { useHydrated } from "remix-utils/use-hydrated";
import {
  GetOrganizationsToAdd,
  loader as organizationsToAddLoader,
} from "./organizations/get-organizations-to-add";
import { getOrganizationsToAdd } from "./organizations/get-organizations-to-add.server";

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
}) {
  const { organizations = [] } = props;

  const [searchParams] = useSearchParams();
  const fetcher = useFetcher<typeof organizationsToAddLoader>();
  const isHydrated = useHydrated();

  const handleFormActions = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector(
      'input[name="add-organization"]'
    ) as HTMLInputElement | null;
    if (input === null) {
      return;
    }
    if (input.value.length > 3) {
      fetcher.submit(event.currentTarget);
    }
    return;
  };

  const data = (
    Array.isArray(fetcher.data) ? fetcher.data : organizations
  ) as typeof organizations;

  return (
    <>
      <fetcher.Form
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
      </fetcher.Form>
      {data.length > 0 ? (
        <ul className="mv-flex mv-flex-col mv-gap-4 mv-group">
          {data.map((organization) => {
            if (organization === null) {
              return null;
            }
            return (
              <li
                key={`request-${organization.id}`}
                className={`mv-flex-col @sm:mv-flex-row mv-gap-4 mv-p-4 mv-border mv-border-neutral-200 mv-rounded-2xl mv-justify-between mv-items-center`}
              >
                <Link
                  to={`/organization/${organization.slug}`}
                  className="mv-flex mv-gap-2 @sm:mv-gap-4 mv-items-center mv-w-full @sm:mv-w-fit"
                >
                  <div className="mv-h-[72px] mv-w-[72px] mv-min-h-[72px] mv-min-w-[72px]">
                    <Avatar size="full" {...organization} />
                  </div>
                  <div>
                    <p className="mv-text-primary mv-text-sm mv-font-bold mv-line-clamp-2">
                      {organization.name}
                    </p>
                    <p className="mv-text-neutral-700 mv-text-sm mv-line-clamp-1">
                      {organization.types
                        .map((relation) => {
                          return relation.organizationType.title;
                        })
                        .join(", ")}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
