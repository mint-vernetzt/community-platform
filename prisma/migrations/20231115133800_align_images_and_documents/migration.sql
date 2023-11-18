/*
  Warnings:

  - You are about to drop the column `alt` on the `image` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `image` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `image` table. All the data in the column will be lost.
  - Added the required column `extension` to the `image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "credits" TEXT;

-- AlterTable
ALTER TABLE "image" DROP COLUMN "alt",
DROP COLUMN "name",
DROP COLUMN "url",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "extension" TEXT NOT NULL,
ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
