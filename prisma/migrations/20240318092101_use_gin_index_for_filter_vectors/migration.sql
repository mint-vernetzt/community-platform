-- DropIndex
DROP INDEX "events_filter_vector_idx";

-- DropIndex
DROP INDEX "organizations_filter_vector_idx";

-- DropIndex
DROP INDEX "profiles_filter_vector_idx";

-- DropIndex
DROP INDEX "projects_filter_vector_idx";

-- CreateIndex
CREATE INDEX "events_filter_vector_idx" ON "events" USING GIN ("filter_vector");

-- CreateIndex
CREATE INDEX "organizations_filter_vector_idx" ON "organizations" USING GIN ("filter_vector");

-- CreateIndex
CREATE INDEX "profiles_filter_vector_idx" ON "profiles" USING GIN ("filter_vector");

-- CreateIndex
CREATE INDEX "projects_filter_vector_idx" ON "projects" USING GIN ("filter_vector");
