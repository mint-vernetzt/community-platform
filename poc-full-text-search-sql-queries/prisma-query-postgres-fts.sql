SELECT
    "public"."profiles"."id",
    "public"."profiles"."first_name",
    "public"."profiles"."email"
FROM
    "public"."profiles"
WHERE
    (
        ("public"."profiles"."id") IN (
            SELECT
                "t0"."id"
            FROM
                "public"."profiles" AS "t0"
                INNER JOIN "public"."offers_on_profiles" AS "j0" ON ("j0"."profileId") = ("t0"."id")
            WHERE
                (
                    ("j0"."profileId", "j0"."offerId") IN (
                        SELECT
                            "t1"."profileId",
                            "t1"."offerId"
                        FROM
                            "public"."offers_on_profiles" AS "t1"
                            INNER JOIN "public"."offer" AS "j1" ON ("j1"."id") = ("t1"."offerId")
                        WHERE
                            (
                                to_tsvector(concat_ws(' ', "j1"."title")) @ @ to_tsquery($ 1)
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR ("public"."profiles"."id") IN (
            SELECT
                "t0"."id"
            FROM
                "public"."profiles" AS "t0"
                INNER JOIN "public"."areas_on_profiles" AS "j0" ON ("j0"."profileId") = ("t0"."id")
            WHERE
                (
                    ("j0"."profileId", "j0"."areaId") IN (
                        SELECT
                            "t1"."profileId",
                            "t1"."areaId"
                        FROM
                            "public"."areas_on_profiles" AS "t1"
                            INNER JOIN "public"."areas" AS "j1" ON ("j1"."id") = ("t1"."areaId")
                        WHERE
                            (
                                to_tsvector(concat_ws(' ', "j1"."name")) @ @ to_tsquery($ 2)
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."areaId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR ("public"."profiles"."id") IN (
            SELECT
                "t0"."id"
            FROM
                "public"."profiles" AS "t0"
                INNER JOIN "public"."seekings_on_profiles" AS "j0" ON ("j0"."profileId") = ("t0"."id")
            WHERE
                (
                    ("j0"."profileId", "j0"."offerId") IN (
                        SELECT
                            "t1"."profileId",
                            "t1"."offerId"
                        FROM
                            "public"."seekings_on_profiles" AS "t1"
                            INNER JOIN "public"."offer" AS "j1" ON ("j1"."id") = ("t1"."offerId")
                        WHERE
                            (
                                to_tsvector(concat_ws(' ', "j1"."title")) @ @ to_tsquery($ 3)
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR to_tsvector(
            concat_ws(
                ' ',
                "public"."profiles"."username",
                "public"."profiles"."email",
                "public"."profiles"."phone",
                "public"."profiles"."website",
                "public"."profiles"."facebook",
                "public"."profiles"."linkedin",
                "public"."profiles"."twitter",
                "public"."profiles"."xing",
                "public"."profiles"."instagram",
                "public"."profiles"."youtube",
                "public"."profiles"."bio",
                "public"."profiles"."academic_title",
                "public"."profiles"."first_name",
                "public"."profiles"."last_name",
                "public"."profiles"."position",
                "public"."profiles"."first_name"
            )
        ) @ @ to_tsquery($ 4)
    ) OFFSET $ 5