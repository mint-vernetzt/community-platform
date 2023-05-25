SELECT
  p.id,
  p.username,
  CASE
    WHEN (pv.email IS TRUE) THEN p.email
    ELSE '' :: text
  END AS email,
  CASE
    WHEN (pv."position" IS TRUE) THEN p."position"
    ELSE NULL :: text
  END AS "position",
  CASE
    WHEN (pv.phone IS TRUE) THEN p.phone
    ELSE NULL :: text
  END AS phone,
  CASE
    WHEN (pv.bio IS TRUE) THEN p.bio
    ELSE NULL :: text
  END AS bio,
  CASE
    WHEN (pv.skills IS TRUE) THEN p.skills
    ELSE ARRAY [] :: text []
  END AS skills,
  CASE
    WHEN (pv.interests IS TRUE) THEN p.interests
    ELSE ARRAY [] :: text []
  END AS interests,
  CASE
    WHEN (pv.seekings IS TRUE) THEN array_remove(array_agg(DISTINCT offer.title), NULL :: text)
    ELSE ARRAY [] :: text []
  END AS seekings,
  CASE
    WHEN (pv.offers IS TRUE) THEN array_remove(array_agg(DISTINCT seeking.title), NULL :: text)
    ELSE ARRAY [] :: text []
  END AS offers,
  CASE
    WHEN (pv.website IS TRUE) THEN p.website
    ELSE NULL :: text
  END AS website,
  CASE
    WHEN (pv.facebook IS TRUE) THEN p.facebook
    ELSE NULL :: text
  END AS facebook,
  CASE
    WHEN (pv.linkedin IS TRUE) THEN p.linkedin
    ELSE NULL :: text
  END AS linkedin,
  CASE
    WHEN (pv.twitter IS TRUE) THEN p.twitter
    ELSE NULL :: text
  END AS twitter,
  CASE
    WHEN (pv.youtube IS TRUE) THEN p.youtube
    ELSE NULL :: text
  END AS youtube,
  CASE
    WHEN (pv.instagram IS TRUE) THEN p.instagram
    ELSE NULL :: text
  END AS instagram,
  CASE
    WHEN (pv.xing IS TRUE) THEN p.xing
    ELSE NULL :: text
  END AS xing,
  p.score
FROM
  (
    (
      (
        (
          (
            profiles p
            JOIN seekings_on_profiles ON ((p.id = seekings_on_profiles."profileId"))
          )
          JOIN offer seeking ON ((seekings_on_profiles."offerId" = seeking.id))
        )
        JOIN offers_on_profiles ON ((p.id = offers_on_profiles."profileId"))
      )
      JOIN offer ON ((offers_on_profiles."offerId" = offer.id))
    )
    JOIN profile_visibilities pv ON ((pv.profile_id = p.id))
  )
GROUP BY
  p.id,
  pv.email,
  pv."position",
  pv.phone,
  pv.bio,
  pv.skills,
  pv.interests,
  pv.seekings,
  pv.offers,
  pv.website,
  pv.facebook,
  pv.linkedin,
  pv.twitter,
  pv.youtube,
  pv.instagram,
  pv.xing;