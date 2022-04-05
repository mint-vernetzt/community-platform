/*
  Warnings:

  - You are about to drop the column `createdAt` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `publicFields` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `quoteAuthor` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `quoteAuthorInformation` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `streetNumber` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `supportedBy` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `academicTitle` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `publicFields` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `profiles` table. All the data in the column will be lost.
  - Added the required column `street_number` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip_code` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `terms_accepted` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "createdAt",
DROP COLUMN "publicFields",
DROP COLUMN "quoteAuthor",
DROP COLUMN "quoteAuthorInformation",
DROP COLUMN "streetNumber",
DROP COLUMN "supportedBy",
DROP COLUMN "updatedAt",
DROP COLUMN "zipCode",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "public_fields" TEXT[],
ADD COLUMN     "quote_author" TEXT,
ADD COLUMN     "quote_author_information" TEXT,
ADD COLUMN     "street_number" TEXT NOT NULL,
ADD COLUMN     "supported_by" TEXT[],
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "zip_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "academicTitle",
DROP COLUMN "createdAt",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "publicFields",
DROP COLUMN "updatedAt",
ADD COLUMN     "academic_title" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "public_fields" TEXT[],
ADD COLUMN     "terms_accepted" BOOLEAN NOT NULL,
ADD COLUMN     "terms_accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
