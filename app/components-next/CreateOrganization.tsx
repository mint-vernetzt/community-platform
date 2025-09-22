import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { Button } from "@mint-vernetzt/components/src/molecules/Button";
import { Form } from "react-router";
import { type MyOrganizationsLocales } from "./../routes/my/organizations.server";
import { SearchOrganizations } from "~/lib/utils/searchParams";
import { useIsSubmitting } from "~/lib/hooks/useIsSubmitting";

export function CreateOrganization(props: {
  name: string;
  locales: MyOrganizationsLocales;
}) {
  const { locales } = props;
  const isSubmitting = useIsSubmitting("/organization/create");
  return (
    <div className="flex flex-col gap-4 group">
      <div className="flex-col @sm:flex-row gap-4 p-4 border border-neutral-200 rounded-2xl justify-between items-center flex">
        <div className="flex gap-2 @sm:gap-4 items-center w-full @sm:w-fit">
          <div className="h-[72px] w-[72px] min-h-[72px] min-w-[72px]">
            <Avatar size="full" name={props.name} />
          </div>
          <p className="text-primary text-sm font-bold line-clamp-2">
            {props.name}
          </p>
        </div>
        <Form method="get" action="/organization/create">
          <input type="hidden" name={SearchOrganizations} value={props.name} />
          <Button type="submit" disabled={isSubmitting}>
            {locales.route.requestOrganizationMembership.create}
          </Button>
        </Form>
      </div>
    </div>
  );
}
