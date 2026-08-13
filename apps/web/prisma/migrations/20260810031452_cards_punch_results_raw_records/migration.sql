-- Card holder management, punch outcome classification, and raw device records.
--
-- Hand-written rather than auto-generated because the generated version would
-- (a) fail on any table that already has rows, since several new columns are
-- NOT NULL without defaults, and (b) throw away existing REJECTED requests when
-- narrowing the RequestStatus enum. Both are handled with explicit backfills so
-- this migration is safe on a clean database and on the dev database alike.

-- CreateEnum
CREATE TYPE "CardCategory" AS ENUM ('NEWSPAPER', 'MILK', 'HOUSE_HELP', 'CLEANER', 'DRIVER', 'SOCIETY_STAFF', 'DELIVERY_REGULAR', 'VENDOR', 'RESIDENT', 'OTHER');
CREATE TYPE "PunchResult" AS ENUM ('AUTHORIZED', 'UNKNOWN_CARD', 'INACTIVE_CARD', 'EXPIRED_CARD', 'NOT_YET_VALID', 'OUTSIDE_HOURS', 'PARSE_ERROR');
CREATE TYPE "ParseStatus" AS ENUM ('PARSED', 'FAILED', 'IGNORED');
CREATE TYPE "CardMatchMode" AS ENUM ('NONE', 'EXACT', 'ZERO_PADDED');

-- RequestStatus: REJECTED -> DENIED, mapping existing rows instead of dropping them.
CREATE TYPE "RequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'CANCELLED');
ALTER TABLE "VisitorRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VisitorRequest" ALTER COLUMN "status" TYPE "RequestStatus_new"
  USING (CASE "status"::text WHEN 'REJECTED' THEN 'DENIED' ELSE "status"::text END)::"RequestStatus_new";
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";
ALTER TABLE "VisitorRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AccessCard: add new columns nullable, carry the old holder data across, then enforce NOT NULL.
ALTER TABLE "AccessCard"
  ADD COLUMN "cardNumberCompact" TEXT,
  ADD COLUMN "category" "CardCategory" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "mobileNumber" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "personName" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "AccessCard" SET
  "personName" = COALESCE(NULLIF("holderName", ''), 'Unknown'),
  "cardNumberCompact" = COALESCE(NULLIF(ltrim("cardNumber", '0'), ''), '0'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "personName" IS NULL;

ALTER TABLE "AccessCard"
  ALTER COLUMN "cardNumberCompact" SET NOT NULL,
  ALTER COLUMN "personName" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "AccessCard" DROP COLUMN "holderName", DROP COLUMN "holderType";
DROP TYPE "CardHolderType";

-- PunchEvent: replace the loose isFlagged/flagReason pair with an explicit result,
-- and replace the (serial, card, time) unique with a fingerprint that also works
-- for records that could not be parsed at all.
DROP INDEX "PunchEvent_deviceSerial_cardNumber_punchedAt_key";

ALTER TABLE "PunchEvent"
  ADD COLUMN "category" "CardCategory",
  ADD COLUMN "matchMode" "CardMatchMode" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "personName" TEXT,
  ADD COLUMN "fingerprint" TEXT,
  ADD COLUMN "result" "PunchResult";

UPDATE "PunchEvent" SET
  "fingerprint" = "id",
  "result" = CASE WHEN "isRecognised" THEN 'AUTHORIZED'::"PunchResult" ELSE 'UNKNOWN_CARD'::"PunchResult" END
WHERE "fingerprint" IS NULL;

ALTER TABLE "PunchEvent"
  ALTER COLUMN "fingerprint" SET NOT NULL,
  ALTER COLUMN "result" SET NOT NULL;

ALTER TABLE "PunchEvent"
  DROP COLUMN "flagReason",
  DROP COLUMN "isFlagged",
  DROP COLUMN "isRecognised",
  DROP COLUMN "rawLine";

-- Device diagnostics fields
ALTER TABLE "Device"
  ADD COLUMN "lastHandshakeAt" TIMESTAMP(3),
  ADD COLUMN "lastPunchAt" TIMESTAMP(3),
  ADD COLUMN "lastSourceIp" TEXT,
  ADD COLUMN "lastUserAgent" TEXT;

-- Raw device records: everything the machine sent, kept regardless of parse outcome.
CREATE TABLE "DeviceRawRecord" (
    "id" TEXT NOT NULL,
    "deviceSerial" TEXT NOT NULL,
    "tableName" TEXT,
    "rawLine" TEXT NOT NULL,
    "rawBody" TEXT NOT NULL,
    "queryString" TEXT,
    "sourceIp" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parseStatus" "ParseStatus" NOT NULL,
    "parseError" TEXT,
    "parsedCardNumber" TEXT,
    "parsedPunchedAt" TIMESTAMP(3),
    "fingerprint" TEXT NOT NULL,
    "punchEventId" TEXT,
    CONSTRAINT "DeviceRawRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeviceRawRecord_fingerprint_key" ON "DeviceRawRecord"("fingerprint");
CREATE INDEX "DeviceRawRecord_deviceSerial_receivedAt_idx" ON "DeviceRawRecord"("deviceSerial", "receivedAt");
CREATE INDEX "DeviceRawRecord_parseStatus_receivedAt_idx" ON "DeviceRawRecord"("parseStatus", "receivedAt");
CREATE INDEX "DeviceRawRecord_receivedAt_idx" ON "DeviceRawRecord"("receivedAt");

CREATE INDEX "AccessCard_cardNumberCompact_idx" ON "AccessCard"("cardNumberCompact");
CREATE INDEX "AccessCard_isActive_idx" ON "AccessCard"("isActive");
CREATE UNIQUE INDEX "PunchEvent_fingerprint_key" ON "PunchEvent"("fingerprint");
CREATE INDEX "PunchEvent_result_punchedAt_idx" ON "PunchEvent"("result", "punchedAt");
CREATE INDEX "PunchEvent_deviceSerial_punchedAt_idx" ON "PunchEvent"("deviceSerial", "punchedAt");

ALTER TABLE "DeviceRawRecord" ADD CONSTRAINT "DeviceRawRecord_punchEventId_fkey" FOREIGN KEY ("punchEventId") REFERENCES "PunchEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
