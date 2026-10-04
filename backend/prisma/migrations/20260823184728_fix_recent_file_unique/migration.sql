/*
  Warnings:

  - You are about to drop the `RecentFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RecentFile";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "recent_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recent_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "recent_files_fileId_idx" ON "recent_files"("fileId");

-- CreateIndex
CREATE INDEX "recent_files_userId_idx" ON "recent_files"("userId");

-- CreateIndex
CREATE INDEX "recent_files_createdAt_idx" ON "recent_files"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recent_files_fileId_userId_key" ON "recent_files"("fileId", "userId");
