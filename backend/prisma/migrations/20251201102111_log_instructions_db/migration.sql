-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "uploadType" TEXT NOT NULL,
    "fileSize" BIGINT,
    "totalLines" INTEGER,
    "rawContent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Error" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "logId" TEXT NOT NULL,
    "matchedRuleId" TEXT,
    "errorType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "solution" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstOccurrenceLine" INTEGER,
    "lastOccurrenceLine" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Error_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Log" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Error_matchedRuleId_fkey" FOREIGN KEY ("matchedRuleId") REFERENCES "Rule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErrorOccurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorId" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "rawLine" TEXT NOT NULL,
    "contextBefore" TEXT,
    "contextAfter" TEXT,
    "sequence" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ErrorOccurrence_errorId_fkey" FOREIGN KEY ("errorId") REFERENCES "Error" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ErrorOccurrence_logId_fkey" FOREIGN KEY ("logId") REFERENCES "Log" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "regex" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "solution" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "weight" INTEGER NOT NULL DEFAULT 50,
    "categories" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RuleHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "regex" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "solution" TEXT,
    "severity" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "categories" TEXT,
    "changeLog" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RuleHistory_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Log_createdAt_idx" ON "Log"("createdAt");

-- CreateIndex
CREATE INDEX "Log_fileName_idx" ON "Log"("fileName");

-- CreateIndex
CREATE INDEX "Error_logId_idx" ON "Error"("logId");

-- CreateIndex
CREATE INDEX "Error_severity_idx" ON "Error"("severity");

-- CreateIndex
CREATE INDEX "Error_matchedRuleId_idx" ON "Error"("matchedRuleId");

-- CreateIndex
CREATE INDEX "ErrorOccurrence_errorId_idx" ON "ErrorOccurrence"("errorId");

-- CreateIndex
CREATE INDEX "ErrorOccurrence_lineNumber_idx" ON "ErrorOccurrence"("lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_name_key" ON "Rule"("name");

-- CreateIndex
CREATE INDEX "Rule_enabled_idx" ON "Rule"("enabled");

-- CreateIndex
CREATE INDEX "Rule_severity_idx" ON "Rule"("severity");

-- CreateIndex
CREATE INDEX "Rule_updatedAt_idx" ON "Rule"("updatedAt");

-- CreateIndex
CREATE INDEX "RuleHistory_ruleId_idx" ON "RuleHistory"("ruleId");

-- CreateIndex
CREATE INDEX "RuleHistory_changedAt_idx" ON "RuleHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RuleHistory_ruleId_version_key" ON "RuleHistory"("ruleId", "version");
