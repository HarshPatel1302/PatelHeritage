-- CreateEnum
CREATE TYPE "Role" AS ENUM ('RESIDENT', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'SECURITY', 'ADMIN', 'COOK');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('KIOSK', 'GUARD', 'PREAPPROVED', 'CARD');

-- CreateEnum
CREATE TYPE "VisitorPurpose" AS ENUM ('GUEST', 'DELIVERY', 'SERVICE', 'CAB', 'DOMESTIC_HELP', 'OTHER');

-- CreateEnum
CREATE TYPE "PunchDirection" AS ENUM ('IN', 'OUT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CardHolderType" AS ENUM ('RESIDENT', 'STAFF', 'VENDOR');

-- CreateEnum
CREATE TYPE "Gate" AS ENUM ('FRONT', 'BACK');

-- CreateTable
CREATE TABLE "Flat" (
    "id" TEXT NOT NULL,
    "wing" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "room" INTEGER NOT NULL,
    "isOccupied" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Flat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RESIDENT',
    "flatId" TEXT,
    "tenantName" TEXT,
    "tenantPhone" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorRequest" (
    "id" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "visitorName" TEXT,
    "visitorPhone" TEXT,
    "purpose" "VisitorPurpose" NOT NULL DEFAULT 'GUEST',
    "source" "RequestSource" NOT NULL,
    "gate" "Gate" NOT NULL DEFAULT 'FRONT',
    "photoKey" TEXT,
    "photoPurgeAfter" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "overriddenByGuard" BOOLEAN NOT NULL DEFAULT false,
    "decisionNote" TEXT,
    "escalatedToGuard" BOOLEAN NOT NULL DEFAULT false,
    "kioskSessionId" TEXT,
    "ipAddress" TEXT,
    "vehicleNumber" TEXT,

    CONSTRAINT "VisitorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessCard" (
    "id" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "holderType" "CardHolderType" NOT NULL,
    "holderName" TEXT NOT NULL,
    "userId" TEXT,
    "flatId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "allowedFromHour" INTEGER,
    "allowedToHour" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gate" "Gate" NOT NULL DEFAULT 'FRONT',
    "direction" "PunchDirection" NOT NULL DEFAULT 'UNKNOWN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "firmware" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PunchEvent" (
    "id" TEXT NOT NULL,
    "deviceSerial" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "cardId" TEXT,
    "direction" "PunchDirection" NOT NULL DEFAULT 'UNKNOWN',
    "punchedAt" TIMESTAMP(3) NOT NULL,
    "verifyMode" INTEGER,
    "isRecognised" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "rawLine" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PunchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCommand" (
    "id" TEXT NOT NULL,
    "deviceSerial" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "cardNumber" TEXT,
    "reason" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreApproval" (
    "id" TEXT NOT NULL,
    "flatId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT,
    "code" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Flat_wing_floor_idx" ON "Flat"("wing", "floor");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_flatId_idx" ON "User"("flatId");

-- CreateIndex
CREATE INDEX "VisitorRequest_flatId_status_idx" ON "VisitorRequest"("flatId", "status");

-- CreateIndex
CREATE INDEX "VisitorRequest_status_expiresAt_idx" ON "VisitorRequest"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "VisitorRequest_createdAt_idx" ON "VisitorRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccessCard_cardNumber_key" ON "AccessCard"("cardNumber");

-- CreateIndex
CREATE INDEX "AccessCard_userId_idx" ON "AccessCard"("userId");

-- CreateIndex
CREATE INDEX "AccessCard_flatId_idx" ON "AccessCard"("flatId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "PunchEvent_punchedAt_idx" ON "PunchEvent"("punchedAt");

-- CreateIndex
CREATE INDEX "PunchEvent_cardId_punchedAt_idx" ON "PunchEvent"("cardId", "punchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PunchEvent_deviceSerial_cardNumber_punchedAt_key" ON "PunchEvent"("deviceSerial", "cardNumber", "punchedAt");

-- CreateIndex
CREATE INDEX "DeviceCommand_deviceSerial_sentAt_idx" ON "DeviceCommand"("deviceSerial", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "BlacklistEntry_phone_idx" ON "BlacklistEntry"("phone");

-- CreateIndex
CREATE INDEX "BlacklistEntry_cardNumber_idx" ON "BlacklistEntry"("cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PreApproval_code_key" ON "PreApproval"("code");

-- CreateIndex
CREATE INDEX "PreApproval_code_idx" ON "PreApproval"("code");

-- CreateIndex
CREATE INDEX "PreApproval_flatId_idx" ON "PreApproval"("flatId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorRequest" ADD CONSTRAINT "VisitorRequest_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorRequest" ADD CONSTRAINT "VisitorRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessCard" ADD CONSTRAINT "AccessCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessCard" ADD CONSTRAINT "AccessCard_flatId_fkey" FOREIGN KEY ("flatId") REFERENCES "Flat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchEvent" ADD CONSTRAINT "PunchEvent_deviceSerial_fkey" FOREIGN KEY ("deviceSerial") REFERENCES "Device"("serialNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchEvent" ADD CONSTRAINT "PunchEvent_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "AccessCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCommand" ADD CONSTRAINT "DeviceCommand_deviceSerial_fkey" FOREIGN KEY ("deviceSerial") REFERENCES "Device"("serialNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
