-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Share" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Share_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Share" ("createdAt", "downloads", "expiresAt", "fileId", "filePath", "id", "token", "userId") SELECT "createdAt", "downloads", "expiresAt", "fileId", "filePath", "id", "token", "userId" FROM "Share";
DROP TABLE "Share";
ALTER TABLE "new_Share" RENAME TO "Share";
CREATE UNIQUE INDEX "Share_token_key" ON "Share"("token");
CREATE INDEX "Share_token_idx" ON "Share"("token");
CREATE INDEX "Share_fileId_idx" ON "Share"("fileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
