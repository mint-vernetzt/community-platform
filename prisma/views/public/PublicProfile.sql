SELECT
  p.id,
  CASE
    WHEN (pv.username IS TRUE) THEN p.username
    ELSE '' :: text
  END AS username,
  CASE
    WHEN (pv.email IS TRUE) THEN p.email
    ELSE '' :: text
  END AS email,
  CASE
    WHEN (pv.phone IS TRUE) THEN p.phone
    ELSE NULL :: text
  END AS phone,
  CASE
    WHEN (pv.website IS TRUE) THEN p.website
    ELSE NULL :: text
  END AS website,
  CASE
    WHEN (pv.avatar IS TRUE) THEN p.avatar
    ELSE NULL :: text
  END AS avatar,
  CASE
    WHEN (pv.background IS TRUE) THEN p.background
    ELSE NULL :: text
  END AS background,
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
    WHEN (pv.xing IS TRUE) THEN p.xing
    ELSE NULL :: text
  END AS xing,
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
    WHEN (pv.academic_title IS TRUE) THEN p.academic_title
    ELSE NULL :: text
  END AS "academicTitle",
  CASE
    WHEN (pv.created_at IS TRUE) THEN p.created_at
    ELSE ('1970-01-01' :: date) :: timestamp without time zone
  END AS "createdAt",
  CASE
    WHEN (pv.first_name IS TRUE) THEN p.first_name
    ELSE NULL :: text
  END AS "firstName",
  CASE
    WHEN (pv.last_name IS TRUE) THEN p.last_name
    ELSE NULL :: text
  END AS "lastName",
  CASE
    WHEN (pv.terms_accepted IS TRUE) THEN p.terms_accepted
    ELSE TRUE
  END AS "termsAccepted",
  CASE
    WHEN (pv.terms_accepted_at IS TRUE) THEN p.terms_accepted_at
    ELSE ('1970-01-01' :: date) :: timestamp without time zone
  END AS "termsAcceptedAt",
  CASE
    WHEN (pv.updated_at IS TRUE) THEN p.updated_at
    ELSE ('1970-01-01' :: date) :: timestamp without time zone
  END AS "updatedAt",
  CASE
    WHEN (pv."position" IS TRUE) THEN p."position"
    ELSE NULL :: text
  END AS "position",
  CASE
    WHEN (pv.instagram IS TRUE) THEN p.instagram
    ELSE NULL :: text
  END AS instagram,
  CASE
    WHEN (pv.youtube IS TRUE) THEN p.youtube
    ELSE NULL :: text
  END AS youtube,
  CASE
    WHEN (pv.score IS TRUE) THEN p.score
    ELSE 0
  END AS score,
  CASE
    WHEN (pv.seekings IS TRUE) THEN array_remove(array_agg(DISTINCT seeking.title), NULL :: text)
    ELSE ARRAY [] :: text []
  END AS seekings,
  CASE
    WHEN (pv.offers IS TRUE) THEN array_remove(array_agg(DISTINCT offer.title), NULL :: text)
    ELSE ARRAY [] :: text []
  END AS offers
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
  pv.username,
  pv.email,
  pv.phone,
  pv.website,
  pv.avatar,
  pv.background,
  pv.facebook,
  pv.linkedin,
  pv.twitter,
  pv.xing,
  pv.bio,
  pv.skills,
  pv.interests,
  pv.academic_title,
  pv.created_at,
  pv.first_name,
  pv.last_name,
  pv.terms_accepted,
  pv.terms_accepted_at,
  pv.updated_at,
  pv."position",
  pv.instagram,
  pv.youtube,
  pv.score,
  pv.seekings,
  pv.offers;