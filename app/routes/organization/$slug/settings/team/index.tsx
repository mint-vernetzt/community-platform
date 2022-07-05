import { Profile } from "@prisma/client";
import { LoaderFunction, useFetcher, useLoaderData, useParams } from "remix";
import { Form } from "remix-forms";
import { badRequest, notFound } from "remix-utils";
import { getInitials } from "~/lib/profile/getInitials";
import { prismaClient } from "~/prisma";
import Add from "./add";
import { schema as deleteSchema } from "./remove";
import { getOrganizationBySlug } from "./utils.server";

type ProfileData = Pick<
  Profile,
  "id" | "username" | "firstName" | "lastName" | "avatar" | "position"
>;

type Member = {
  isPrivileged: boolean;
  organizationId: string;
  profile: ProfileData;
};

type LoaderData = Member[];

export const loader: LoaderFunction = async (args) => {
  const { params } = args;
  const { slug } = params;

  if (slug === undefined) {
    throw badRequest({ message: "Organization slug missing" });
  }

  const organization = await getOrganizationBySlug(slug);
  if (organization === null) {
    throw notFound({
      message: `Couldn't find organization with slug "${slug}"`,
    });
  }

  const profiles = await prismaClient.memberOfOrganization.findMany({
    select: {
      isPrivileged: true,
      organizationId: true,
      profile: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          position: true,
        },
      },
    },
    where: {
      organizationId: organization.id,
    },
  });

  return profiles;
};

function MemberRemoveForm(props: Member & { slug: string }) {
  const fetcher = useFetcher();

  const { profile, isPrivileged, organizationId, slug } = props;
  const initials = getInitials(profile);

  return (
    <Form
      method="post"
      key={`${profile.username}`}
      action={`/organization/${slug}/settings/team/remove`}
      schema={deleteSchema}
      hiddenFields={["profileId", "organizationId"]}
      values={{ profileId: profile.id, organizationId }}
      fetcher={fetcher}
    >
      {({ Field, Button, Errors }) => {
        return (
          <>
            <p>
              {initials}, {profile.firstName}, {profile.lastName} {isPrivileged}
            </p>
            <Field name="profileId" />
            <Field name="organizationId" />
            <Errors />
            <Button>X</Button>
          </>
        );
      }}
    </Form>
  );
}

function Index() {
  const { slug } = useParams();
  const loaderData = useLoaderData<LoaderData>();

  return (
    <>
      <h1>Das Team</h1>
      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua.
      </p>
      {loaderData.map((data) => {
        return (
          <MemberRemoveForm
            key={data.profile.username}
            {...data}
            slug={slug as string}
          />
        );
      })}
      <Add />
    </>
  );
}

export default Index;
