-- AlterTable: additional teacher profile detail. All optional/defaulted so
-- existing profiles remain valid with no backfill.
ALTER TABLE "teacher_profiles" ADD COLUMN "headline" TEXT;
ALTER TABLE "teacher_profiles" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "teacher_profiles" ADD COLUMN "achievements" TEXT;
