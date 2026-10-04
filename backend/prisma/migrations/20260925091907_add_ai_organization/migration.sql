-- CreateTable
CREATE TABLE "AICategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#4f46e5',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AISuggestion_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "checksum" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aiCategoryId" TEXT,
    CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "File_aiCategoryId_fkey" FOREIGN KEY ("aiCategoryId") REFERENCES "AICategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_File" ("checksum", "createdAt", "deletedAt", "filename", "folderId", "id", "isDeleted", "mimeType", "originalName", "path", "size", "updatedAt", "userId") SELECT "checksum", "createdAt", "deletedAt", "filename", "folderId", "id", "isDeleted", "mimeType", "originalName", "path", "size", "updatedAt", "userId" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE INDEX "File_userId_idx" ON "File"("userId");
CREATE INDEX "File_isDeleted_idx" ON "File"("isDeleted");
CREATE INDEX "File_folderId_idx" ON "File"("folderId");
CREATE INDEX "File_checksum_idx" ON "File"("checksum");
CREATE INDEX "File_aiCategoryId_idx" ON "File"("aiCategoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AICategory_name_key" ON "AICategory"("name");

-- CreateIndex
CREATE INDEX "AICategory_priority_idx" ON "AICategory"("priority");

-- CreateIndex
CREATE INDEX "AISuggestion_fileId_idx" ON "AISuggestion"("fileId");

-- CreateIndex
CREATE INDEX "AISuggestion_type_idx" ON "AISuggestion"("type");

-- CreateIndex
CREATE INDEX "AISuggestion_applied_idx" ON "AISuggestion"("applied");
