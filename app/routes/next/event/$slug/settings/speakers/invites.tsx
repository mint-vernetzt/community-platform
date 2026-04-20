import { redirect, type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/speakers/invites"];

  const event = await prismaClient.event.findUnique({
    where: { slug: params.slug },
    select: {
      _count: {
        select: {
          profileJoinInvites: {
            where: {
              role: "speaker",
              status: "pending",
            },
          },
        },
      },
    },
  });
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event._count.profileJoinInvites === 0) {
    return redirect(`/next/event/${params.slug}/settings/speakers/add`);
  }

  return { locales };
}

function SpeakerInvites() {
  return <>Speaker invites</>;
}

export default SpeakerInvites;
