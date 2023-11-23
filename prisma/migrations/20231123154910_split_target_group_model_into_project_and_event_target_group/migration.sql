-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "eventTargetGroups" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "projectTargetGroups" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "event_target_groups_of_events" (
    "event_target_group_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_target_groups_of_events_pkey" PRIMARY KEY ("event_target_group_id","event_id")
);

-- CreateTable
CREATE TABLE "project_target_groups_of_projects" (
    "project_target_group_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_target_groups_of_projects_pkey" PRIMARY KEY ("project_target_group_id","project_id")
);

-- CreateTable
CREATE TABLE "event_target_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "event_target_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_target_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "project_target_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_target_groups_slug_key" ON "event_target_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_target_groups_title_key" ON "event_target_groups"("title");

-- CreateIndex
CREATE UNIQUE INDEX "project_target_groups_slug_key" ON "project_target_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_target_groups_title_key" ON "project_target_groups"("title");

-- AddForeignKey
ALTER TABLE "event_target_groups_of_events" ADD CONSTRAINT "event_target_groups_of_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_target_groups_of_events" ADD CONSTRAINT "event_target_groups_of_events_event_target_group_id_fkey" FOREIGN KEY ("event_target_group_id") REFERENCES "event_target_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_target_groups_of_projects" ADD CONSTRAINT "project_target_groups_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_target_groups_of_projects" ADD CONSTRAINT "project_target_groups_of_projects_project_target_group_id_fkey" FOREIGN KEY ("project_target_group_id") REFERENCES "project_target_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
