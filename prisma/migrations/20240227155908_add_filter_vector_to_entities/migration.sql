-- AlterTable
ALTER TABLE "events" ADD COLUMN     "filter_vector" tsvector;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "filter_vector" tsvector;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "filter_vector" tsvector;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "filter_vector" tsvector;

-- CreateIndex
CREATE INDEX "events_filter_vector_idx" ON "events"("filter_vector");

-- CreateIndex
CREATE INDEX "organizations_filter_vector_idx" ON "organizations"("filter_vector");

-- CreateIndex
CREATE INDEX "profiles_filter_vector_idx" ON "profiles"("filter_vector");

-- CreateIndex
CREATE INDEX "projects_filter_vector_idx" ON "projects"("filter_vector");
