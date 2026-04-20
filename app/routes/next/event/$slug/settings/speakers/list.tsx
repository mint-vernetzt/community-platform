import { redirect, type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { detectLanguage } from "~/root.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/speakers/list"];

  const event = await prismaClient.event.findUnique({
    where: { slug: params.slug },
    select: { _count: { select: { speakers: true } } },
  });
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event._count.speakers === 0) {
    return redirect(`/next/event/${params.slug}/settings/speakers/add`);
  }

  return { locales };
};

function SpeakerList() {
  return <>Speaker List</>;
}

export default SpeakerList;
