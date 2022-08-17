import { extendType, objectType } from "nexus";
import { prismaClient } from "~/prisma";

export const Event = objectType({
  name: "Event", // <- Name of your type
  definition(t) {
    t.string("id"); // <- Field named `id` of type `Int`
    t.string("title"); // <- Field named `title` of type `String`
    t.string("body"); // <- Field named `body` of type `String`
    t.string("published");
    t.boolean("public");
  },
});

export const EventsQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.field("events", {
      type: "Event",
      resolve: async (args) => {
        const areas = await prismaClient.state.findMany();

        return areas.map((area) => ({
          id: area.id,
          title: area.name,
          body: "manu",
          published: new Date().toISOString(),
          public: true,
        }));
      },
    });
  },
});
