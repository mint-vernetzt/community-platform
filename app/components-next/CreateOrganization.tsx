import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Form } from "react-router";
import { type MyOrganizationsLocales } from "./../routes/my/organizations.server";
import { SearchOrganizations } from "~/lib/utils/searchParams";

export function CreateOrganization(props: {
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
          <input type="hidden" name={SearchOrganizations} value={props.name} />
          <Button type="submit">
            {locales.route.requestOrganizationMembership.create}
          </Button>
        </Form>
      </div>
    </div>
  );
}
