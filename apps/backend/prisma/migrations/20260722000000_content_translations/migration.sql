ALTER TABLE "profile"
  ADD COLUMN "tagline_en" TEXT,
  ADD COLUMN "bio_en" TEXT;

ALTER TABLE "experience"
  ADD COLUMN "title_en" TEXT,
  ADD COLUMN "description_en" TEXT;

ALTER TABLE "project"
  ADD COLUMN "description_en" TEXT;
