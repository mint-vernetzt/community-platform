import Handlebars from "handlebars";
import { prismaClient } from "~/prisma.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findFirst({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      startTime: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueZipCode: true,
      venueCity: true,
      conferenceLink: true,
    },
  });
  return event;
}

export function getCompiledHtmlString(options: {
  template: string;
  data: Record<string, any>;
}) {
  const { template, data } = options;
  const compiledTemplate = Handlebars.compile(template);
  const htmlString = compiledTemplate(data);
  return htmlString;
}
