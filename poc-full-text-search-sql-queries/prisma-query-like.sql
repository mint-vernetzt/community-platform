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
        OR "public"."profiles"."bio" :: text LIKE $ 7
        OR "public"."profiles"."skills" @ > $ 8
        OR "public"."profiles"."interests" @ > $ 9
        OR "public"."profiles"."academic_title" :: text LIKE $ 10
        OR "public"."profiles"."first_name" :: text LIKE $ 11
        OR "public"."profiles"."last_name" :: text LIKE $ 12
        OR "public"."profiles"."position" :: text LIKE $ 13
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
                                "j1"."name" :: text LIKE $ 14
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
                                "j1"."title" :: text LIKE $ 15
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR "public"."profiles"."first_name" :: text LIKE $ 16
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
                                "j1"."title" :: text LIKE $ 17
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR "public"."profiles"."username" :: text LIKE $ 18
        OR "public"."profiles"."email" :: text LIKE $ 19
        OR "public"."profiles"."phone" :: text LIKE $ 20
        OR "public"."profiles"."website" :: text LIKE $ 21
        OR "public"."profiles"."bio" :: text LIKE $ 22
        OR "public"."profiles"."skills" @ > $ 23
        OR "public"."profiles"."interests" @ > $ 24
        OR "public"."profiles"."academic_title" :: text LIKE $ 25
        OR "public"."profiles"."first_name" :: text LIKE $ 26
        OR "public"."profiles"."last_name" :: text LIKE $ 27
        OR "public"."profiles"."position" :: text LIKE $ 28
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
                                "j1"."name" :: text LIKE $ 29
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
                                "j1"."title" :: text LIKE $ 30
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR "public"."profiles"."first_name" :: text LIKE $ 31
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
                                "j1"."title" :: text LIKE $ 32
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
        OR "public"."profiles"."username" :: text LIKE $ 33
        OR "public"."profiles"."email" :: text LIKE $ 34
        OR "public"."profiles"."phone" :: text LIKE $ 35
        OR "public"."profiles"."website" :: text LIKE $ 36
        OR "public"."profiles"."bio" :: text LIKE $ 37
        OR "public"."profiles"."skills" @ > $ 38
        OR "public"."profiles"."interests" @ > $ 39
        OR "public"."profiles"."academic_title" :: text LIKE $ 40
        OR "public"."profiles"."first_name" :: text LIKE $ 41
        OR "public"."profiles"."last_name" :: text LIKE $ 42
        OR "public"."profiles"."position" :: text LIKE $ 43
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
                                "j1"."name" :: text LIKE $ 44
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
                                "j1"."title" :: text LIKE $ 45
                                AND "t1"."profileId" IS NOT NULL
                                AND "t1"."offerId" IS NOT NULL
                            )
                    )
                    AND "t0"."id" IS NOT NULL
                )
        )
    ) OFFSET $ 46