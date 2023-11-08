-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "additional_disciplines" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "further_description" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "further_disciplines" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "goals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hints" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "idea" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "implementation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "participant_limit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "specialTargetGroups" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "target_group_additions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "targeting" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "video" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "videoSubline" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "further_description" TEXT,
ADD COLUMN     "further_disciplines" TEXT[],
ADD COLUMN     "goals" TEXT,
ADD COLUMN     "hints" TEXT,
ADD COLUMN     "idea" TEXT,
ADD COLUMN     "implementation" TEXT,
ADD COLUMN     "participant_limit" TEXT,
ADD COLUMN     "target_group_additions" TEXT,
ADD COLUMN     "targeting" TEXT,
ADD COLUMN     "video" TEXT,
ADD COLUMN     "video_subline" TEXT;

-- CreateTable
CREATE TABLE "special_target_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "special_target_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_disciplines" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "additional_disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_target_groups_of_projects" (
    "special_target_group_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "special_target_groups_of_projects_pkey" PRIMARY KEY ("special_target_group_id","project_id")
);

-- CreateTable
CREATE TABLE "additional_disciplines_of_projects" (
    "additional_discipline_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "additional_disciplines_of_projects_pkey" PRIMARY KEY ("additional_discipline_id","project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "special_target_groups_slug_key" ON "special_target_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "special_target_groups_title_key" ON "special_target_groups"("title");

-- CreateIndex
CREATE UNIQUE INDEX "additional_disciplines_title_key" ON "additional_disciplines"("title");

-- CreateIndex
CREATE UNIQUE INDEX "additional_disciplines_slug_key" ON "additional_disciplines"("slug");

-- AddForeignKey
ALTER TABLE "special_target_groups_of_projects" ADD CONSTRAINT "special_target_groups_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_target_groups_of_projects" ADD CONSTRAINT "special_target_groups_of_projects_special_target_group_id_fkey" FOREIGN KEY ("special_target_group_id") REFERENCES "special_target_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_disciplines_of_projects" ADD CONSTRAINT "additional_disciplines_of_projects_additional_discipline_i_fkey" FOREIGN KEY ("additional_discipline_id") REFERENCES "additional_disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_disciplines_of_projects" ADD CONSTRAINT "additional_disciplines_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
