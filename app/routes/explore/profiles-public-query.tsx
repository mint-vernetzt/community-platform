import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import { useLoaderData } from "@remix-run/react";
import { prismaClient } from "~/prisma";

export const loader: LoaderFunction = async (args) => {
  console.time("loader profile-public-query");

  const profiles = await prismaClient.$queryRaw`
    select
      p.id,
      case when pv.username is true then p.username else '' end as username,
      case when pv.email is true then p.email else '' end as email,
      case when pv.phone is true then p.phone end as phone,
      case when pv.website is true then p.website end as website,
      case when pv.avatar is true then p.avatar end as avatar,
      case when pv.background is true then p.background end as background,
      case when pv.facebook is true then p.facebook end as facebook,
      case when pv.linkedin is true then p.linkedin end as linkedin,
      case when pv.twitter is true then p.twitter end as twitter,
      case when pv.xing is true then p.xing end as xing,
      case when pv.bio is true then p.bio end as bio,
      case when pv.skills is true then p.skills else ARRAY[]::text[] end as skills,
      case when pv.interests is true then p.interests else ARRAY[]::text[] end as interests,
      case when pv.academic_title is true then p.academic_title end as "academicTitle",
      case when pv.created_at is true then p.created_at else '1970-01-01 00:00:00'::date end as "createdAt",
      case when pv.first_name is true then p.first_name end as "firstName",
      case when pv.last_name is true then p.last_name end as "lastName",
      case when pv.terms_accepted is true then p.terms_accepted else true end as "termsAccepted",
      case when pv.terms_accepted_at is true then p.terms_accepted_at else '1970-01-01 00:00:00'::date end as "termsAcceptedAt",
      case when pv.updated_at is true then p.updated_at else '1970-01-01 00:00:00'::date end as "updatedAt",
      case when pv.position is true then p.position end as position,
      case when pv.instagram is true then p.instagram end as instagram,
      case when pv.youtube is true then p.youtube end as youtube,
      case when pv.score is true then p.score else 0 end as score,
      case when pv.seekings is true then array_remove(array_agg(DISTINCT seeking.title), null) else ARRAY[]::text[] end as seekings,
      case when pv.offers is true then array_remove(array_agg(DISTINCT offer.title), null) else ARRAY[]::text[] end as offers
    from
      profiles p
    join seekings_on_profiles on p.id = seekings_on_profiles."profileId"
    join offer seeking on seekings_on_profiles."offerId" = seeking.id
    join offers_on_profiles on p.id = offers_on_profiles."profileId"
    join offer on offers_on_profiles."offerId" = offer.id
    join profile_visibilities pv on pv.profile_id = p.id
    group by 
      p.id, pv.username, pv.email, pv.phone, pv.website, pv.avatar, pv.background, pv.facebook, pv.linkedin, pv.twitter, pv.xing, pv.bio, pv.skills, pv.interests, pv.academic_title, pv.created_at, pv.first_name, pv.last_name, pv.terms_accepted, pv.terms_accepted_at, pv.updated_at, pv.position, pv.instagram, pv.youtube, pv.score, pv.seekings, pv.offers
    order by p.first_name asc
    limit 10
  `;

  console.timeEnd("loader profile-public-query");

  console.log(profiles);

  return json({ profiles });
};

export default function Public() {
  const loaderData = useLoaderData<typeof loader>();
  const { profiles } = loaderData;

  return (
    <>
      {profiles.map((profile) => {
        return (
          <div key={profile.id}>
            <h1>{profile.username}</h1>
            <pre className="text-xs monospace">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        );
      })}
    </>
  );
}
