import { redirect, type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { getEventBySlug } from "./list.server";
import { Deep } from "~/lib/utils/searchParams";

export async function loader(args: LoaderFunctionArgs) {
  const { params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "Invalid slug", { status: 400 });

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  if (event._count.participants === 0) {
    return redirect(`../add?${Deep}=true`);
  }

  return null;
}

function ParticipantsList() {
  return <h1>Participants List</h1>;
}

export default ParticipantsList;
