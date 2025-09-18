-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "address_supplement" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "email" SET DEFAULT true,
ALTER COLUMN "phone" SET DEFAULT true,
ALTER COLUMN "website" SET DEFAULT true,
ALTER COLUMN "bio" SET DEFAULT true,
ALTER COLUMN "focuses" SET DEFAULT true;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "address_supplement" TEXT;
