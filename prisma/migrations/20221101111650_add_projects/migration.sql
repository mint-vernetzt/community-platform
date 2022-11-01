-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "background" TEXT,
    "headline" TEXT,
    "excerpt" TEXT,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "street" TEXT,
    "street_number" TEXT,
    "zip_code" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "instagram" TEXT,
    "xing" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT NOT NULL,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_groups_of_projects" (
    "target_group_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "target_groups_of_projects_pkey" PRIMARY KEY ("target_group_id","project_id")
);

-- CreateTable
CREATE TABLE "disciplines_of_projects" (
    "discipline_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disciplines_of_projects_pkey" PRIMARY KEY ("discipline_id","project_id")
);

-- CreateTable
CREATE TABLE "awards_of_projects" (
    "award_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "awards_of_projects_pkey" PRIMARY KEY ("award_id","project_id")
);

-- CreateTable
CREATE TABLE "responsible_organizations_of_projects" (
    "project_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responsible_organizations_of_projects_pkey" PRIMARY KEY ("project_id","organization_id")
);

-- CreateTable
CREATE TABLE "team_members_of_projects" (
    "pprofile_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "is_privileged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_of_projects_pkey" PRIMARY KEY ("pprofile_id","project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_referenceId_key" ON "disciplines"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_title_key" ON "disciplines"("title");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_slug_key" ON "disciplines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "awards_title_key" ON "awards"("title");

-- CreateIndex
CREATE UNIQUE INDEX "awards_slug_key" ON "awards"("slug");

-- AddForeignKey
ALTER TABLE "target_groups_of_projects" ADD CONSTRAINT "target_groups_of_projects_target_group_id_fkey" FOREIGN KEY ("target_group_id") REFERENCES "target_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_groups_of_projects" ADD CONSTRAINT "target_groups_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplines_of_projects" ADD CONSTRAINT "disciplines_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplines_of_projects" ADD CONSTRAINT "disciplines_of_projects_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards_of_projects" ADD CONSTRAINT "awards_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards_of_projects" ADD CONSTRAINT "awards_of_projects_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_organizations_of_projects" ADD CONSTRAINT "responsible_organizations_of_projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsible_organizations_of_projects" ADD CONSTRAINT "responsible_organizations_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members_of_projects" ADD CONSTRAINT "team_members_of_projects_pprofile_id_fkey" FOREIGN KEY ("pprofile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members_of_projects" ADD CONSTRAINT "team_members_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
