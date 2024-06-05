import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prismaClient } from "~/prisma.server";

export async function loader(args: LoaderFunctionArgs) {
  const fundings = await prismaClient.funding.findMany({
    select: {
      checksum: true,
      title: true,
      url: true,
      funders: {
        select: {
          funder: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      types: {
        select: {
          type: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
      eligibleEntities: {
        select: {
          entity: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
    },
    skip: 0,
    take: 10,
  });
  return json({ fundings });
}

function Fundings() {
  const loaderData = useLoaderData<typeof loader>();

  return loaderData.fundings.length > 0 ? (
    <div className="mv-container">
      <ul className="mv-flex mv-flex-col mv-gap-4">
        {loaderData.fundings.map((funding) => {
          return (
            <li key={funding.checksum} className="mv-border mv-p-4">
              <a
                href={funding.url}
                className="hover:mv-underline"
                target="_blank"
                rel="noreffer nofollow"
              >
                <h3>{funding.title}</h3>
              </a>
              <h4>Förderer</h4>
              <ul>
                {funding.funders.map((relation) => {
                  return (
                    <li key={relation.funder.slug}>{relation.funder.title}</li>
                  );
                })}
              </ul>
              <h4>Förderart</h4>
              <ul>
                {funding.types.map((relation) => {
                  return (
                    <li key={relation.type.slug}>{relation.type.title}</li>
                  );
                })}
              </ul>
              <h4>Förderbereich</h4>
              <ul>
                {funding.areas.map((relation) => {
                  return (
                    <li key={relation.area.slug}>{relation.area.title}</li>
                  );
                })}
              </ul>
              <h4>Förderberechtigte</h4>
              <ul>
                {funding.eligibleEntities.map((relation) => {
                  return (
                    <li key={relation.entity.slug}>{relation.entity.title}</li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  ) : (
    <p>Nix gefunden!</p>
  );
}

export default Fundings;
