SELECT
    "public"."profiles"."id",
    "public"."profiles"."first_name",
    "public"."profiles"."email"
FROM
    "public"."profiles"
WHERE
    (
        "public"."profiles"."first_name" :: text LIKE $ 1
        OR ("public"."profiles"."id") IN (
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
                                "j1"."title" :: text LIKE $ 2
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR "public"."profiles"."username" :: text LIKE $ 3
        OR "public"."profiles"."email" :: text LIKE $ 4
        OR "public"."profiles"."phone" :: text LIKE $ 5
        OR "public"."profiles"."website" :: text LIKE $ 6
        OR "public"."profiles"."facebook" :: text LIKE $ 7
        OR "public"."profiles"."linkedin" :: text LIKE $ 8
        OR "public"."profiles"."twitter" :: text LIKE $ 9
        OR "public"."profiles"."xing" :: text LIKE $ 10
        OR "public"."profiles"."instagram" :: text LIKE $ 11
        OR "public"."profiles"."youtube" :: text LIKE $ 12
        OR "public"."profiles"."bio" :: text LIKE $ 13
        OR "public"."profiles"."academic_title" :: text LIKE $ 14
        OR "public"."profiles"."first_name" :: text LIKE $ 15
        OR "public"."profiles"."last_name" :: text LIKE $ 16
        OR "public"."profiles"."position" :: text LIKE $ 17
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
                                "j1"."name" :: text LIKE $ 18
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
                                "j1"."title" :: text LIKE $ 19
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
    ) OFFSET $ 20