-- CreateTable
CREATE TABLE "areas_on_fundings" (
    "funding_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,

    CONSTRAINT "areas_on_fundings_pkey" PRIMARY KEY ("funding_id","area_id")
);

-- CreateTable
CREATE TABLE "fundings" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fundings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funders" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "funders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funders_on_fundings" (
    "funding_id" TEXT NOT NULL,
    "funder_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funders_on_fundings_pkey" PRIMARY KEY ("funding_id","funder_id")
);

-- CreateTable
CREATE TABLE "funding_types" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "funding_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_types_on_fundings" (
    "funding_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funding_types_on_fundings_pkey" PRIMARY KEY ("funding_id","type_id")
);

-- CreateTable
CREATE TABLE "funding_areas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "funding_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_areas_on_fundings" (
    "funding_id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funding_areas_on_fundings_pkey" PRIMARY KEY ("funding_id","area_id")
);

-- CreateTable
CREATE TABLE "funding_eligible_entities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "funding_eligible_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_eligible_entities_on_fundings" (
    "funding_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funding_eligible_entities_on_fundings_pkey" PRIMARY KEY ("funding_id","entity_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fundings_checksum_key" ON "fundings"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "funders_title_key" ON "funders"("title");

-- CreateIndex
CREATE UNIQUE INDEX "funders_slug_key" ON "funders"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "funding_types_title_key" ON "funding_types"("title");

-- CreateIndex
CREATE UNIQUE INDEX "funding_types_slug_key" ON "funding_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "funding_areas_title_key" ON "funding_areas"("title");

-- CreateIndex
CREATE UNIQUE INDEX "funding_areas_slug_key" ON "funding_areas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "funding_eligible_entities_title_key" ON "funding_eligible_entities"("title");

-- CreateIndex
CREATE UNIQUE INDEX "funding_eligible_entities_slug_key" ON "funding_eligible_entities"("slug");

-- AddForeignKey
ALTER TABLE "areas_on_fundings" ADD CONSTRAINT "areas_on_fundings_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_on_fundings" ADD CONSTRAINT "areas_on_fundings_funding_id_fkey" FOREIGN KEY ("funding_id") REFERENCES "fundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funders_on_fundings" ADD CONSTRAINT "funders_on_fundings_funding_id_fkey" FOREIGN KEY ("funding_id") REFERENCES "fundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funders_on_fundings" ADD CONSTRAINT "funders_on_fundings_funder_id_fkey" FOREIGN KEY ("funder_id") REFERENCES "funders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_types_on_fundings" ADD CONSTRAINT "funding_types_on_fundings_funding_id_fkey" FOREIGN KEY ("funding_id") REFERENCES "fundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_types_on_fundings" ADD CONSTRAINT "funding_types_on_fundings_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "funding_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_areas_on_fundings" ADD CONSTRAINT "funding_areas_on_fundings_funding_id_fkey" FOREIGN KEY ("funding_id") REFERENCES "fundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_areas_on_fundings" ADD CONSTRAINT "funding_areas_on_fundings_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "funding_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_eligible_entities_on_fundings" ADD CONSTRAINT "funding_eligible_entities_on_fundings_funding_id_fkey" FOREIGN KEY ("funding_id") REFERENCES "fundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_eligible_entities_on_fundings" ADD CONSTRAINT "funding_eligible_entities_on_fundings_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "funding_eligible_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
