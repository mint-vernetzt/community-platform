-- AlterTable
ALTER TABLE "additional_disciplines" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "disciplines" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "event_target_groups" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "event_types" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "experience_levels" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "financings" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "focuses" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "formats" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "offer" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "organization_types" ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "project_target_groups" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "stages" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "target_groups" ADD COLUMN     "description" TEXT;
