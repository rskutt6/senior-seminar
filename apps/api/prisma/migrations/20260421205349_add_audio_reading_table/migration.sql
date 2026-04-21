-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "assignmentType" TEXT;

-- CreateTable
CREATE TABLE "AudioReading" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "sourceType" TEXT DEFAULT 'text',
    "sourceName" TEXT,

    CONSTRAINT "AudioReading_pkey" PRIMARY KEY ("id")
);
