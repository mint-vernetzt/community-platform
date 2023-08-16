import type { Event } from "@prisma/client";
import { prismaClient } from "~/prisma.server";

export async function getRootEvent(id: string) {
  try {
    const result = await prismaClient.$queryRaw`
      WITH RECURSIVE get_root AS (
          SELECT id, parent_event_id, name, slug, published 
          FROM "events" 
          WHERE id = ${id}
        UNION
          SELECT "events".id, "events".parent_event_id, "events".name, "events".slug, "events".published 
          FROM "events"
            JOIN get_root ON "events".id = get_root.parent_event_id
      )
      SELECT * 
      FROM get_root 
      WHERE parent_event_id IS NULL
      AND published = ${true}
      ORDER BY name ASC;`;

    return result as Pick<
      Event,
      "id" | "parentEventId" | "name" | "slug" | "published"
    >[];
  } catch (e) {
    console.error(e);
    return null;
  }
}
