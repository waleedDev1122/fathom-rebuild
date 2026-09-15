-- CreateEnum
CREATE TYPE "ShareAccess" AS ENUM ('ANYONE_WITH_LINK', 'MEETING_PARTICIPANTS_ONLY');

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "autoRecordEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoShareEnabled" BOOLEAN NOT NULL DEFAULT true,
    "botName" TEXT NOT NULL DEFAULT 'Fathom Notetaker',
    "defaultTemplate" "SummaryTemplate" NOT NULL DEFAULT 'ENHANCED',
    "defaultShareAccess" "ShareAccess" NOT NULL DEFAULT 'ANYONE_WITH_LINK',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
