-- Make videoUrl nullable and add cfVideoId
ALTER TABLE "videos" ALTER COLUMN "videoUrl" DROP NOT NULL;
ALTER TABLE "videos" ADD COLUMN "cfVideoId" TEXT;
