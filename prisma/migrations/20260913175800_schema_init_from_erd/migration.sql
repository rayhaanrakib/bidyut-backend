-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'FIELD_TECHNICIAN', 'POWER_OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'HEALTHCARE', 'EDUCATION');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "TechnicianSpecialization" AS ENUM ('LINE', 'TRANSFORMER', 'METERING', 'GENERATION');

-- CreateEnum
CREATE TYPE "OperatorShift" AS ENUM ('MORNING', 'EVENING', 'NIGHT');

-- CreateEnum
CREATE TYPE "OutageStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('PLANNED', 'MAINTENANCE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PRIORITY_RESTORATION', 'SLA_SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');

-- DropEnum
DROP TYPE "auth_provider";

-- DropEnum
DROP TYPE "operator_shift";

-- DropEnum
DROP TYPE "outage_status";

-- DropEnum
DROP TYPE "payment_status";

-- DropEnum
DROP TYPE "payment_type";

-- DropEnum
DROP TYPE "schedule_status";

-- DropEnum
DROP TYPE "schedule_type";

-- DropEnum
DROP TYPE "technician_specialization";

-- DropEnum
DROP TYPE "user_category";

-- DropEnum
DROP TYPE "user_role";

-- DropEnum
DROP TYPE "user_status";

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Substation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Substation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feeder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "substationId" TEXT NOT NULL,
    "capacityMW" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feeder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feederId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutageReport" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "technicianId" TEXT,
    "status" "OutageStatus" NOT NULL DEFAULT 'PENDING',
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "isBulkIncident" BOOLEAN NOT NULL DEFAULT false,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "OutageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outageReportId" TEXT,
    "type" "PaymentType" NOT NULL,
    "amountPaisa" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nid" TEXT,
    "serviceAddress" TEXT,
    "thana" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "landline" TEXT,
    "emergencyContact" TEXT,
    "preferredLanguage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "specialization" "TechnicianSpecialization" NOT NULL DEFAULT 'LINE',
    "experienceYears" INTEGER,
    "certification" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "designation" TEXT,
    "shift" "OperatorShift" NOT NULL DEFAULT 'MORNING',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "type" "ScheduleType" NOT NULL DEFAULT 'PLANNED',
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "feederId" TEXT,
    "areaId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notificationSentAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIAL',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordRequired" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "category" "UserCategory" NOT NULL DEFAULT 'RESIDENTIAL',
    "areaId" TEXT,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "imagePublicId" TEXT NOT NULL DEFAULT '',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "slaActive" BOOLEAN NOT NULL DEFAULT false,
    "slaExpiryDate" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE INDEX "Substation_zoneId_idx" ON "Substation"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Substation_zoneId_name_key" ON "Substation"("zoneId", "name");

-- CreateIndex
CREATE INDEX "Feeder_substationId_idx" ON "Feeder"("substationId");

-- CreateIndex
CREATE UNIQUE INDEX "Feeder_substationId_name_key" ON "Feeder"("substationId", "name");

-- CreateIndex
CREATE INDEX "Area_feederId_idx" ON "Area"("feederId");

-- CreateIndex
CREATE UNIQUE INDEX "Area_feederId_name_key" ON "Area"("feederId", "name");

-- CreateIndex
CREATE INDEX "OutageReport_areaId_idx" ON "OutageReport"("areaId");

-- CreateIndex
CREATE INDEX "OutageReport_status_idx" ON "OutageReport"("status");

-- CreateIndex
CREATE INDEX "OutageReport_reportedAt_idx" ON "OutageReport"("reportedAt");

-- CreateIndex
CREATE INDEX "OutageReport_technicianId_idx" ON "OutageReport"("technicianId");

-- CreateIndex
CREATE INDEX "OutageReport_customerId_idx" ON "OutageReport"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianProfile_userId_key" ON "TechnicianProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicianProfile_employeeId_key" ON "TechnicianProfile"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_userId_key" ON "OperatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_employeeId_key" ON "OperatorProfile"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_employeeId_key" ON "AdminProfile"("employeeId");

-- CreateIndex
CREATE INDEX "Schedule_feederId_idx" ON "Schedule"("feederId");

-- CreateIndex
CREATE INDEX "Schedule_areaId_idx" ON "Schedule"("areaId");

-- CreateIndex
CREATE INDEX "Schedule_startTime_idx" ON "Schedule"("startTime");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_areaId_idx" ON "User"("areaId");

-- AddForeignKey
ALTER TABLE "Substation" ADD CONSTRAINT "Substation_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feeder" ADD CONSTRAINT "Feeder_substationId_fkey" FOREIGN KEY ("substationId") REFERENCES "Substation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_feederId_fkey" FOREIGN KEY ("feederId") REFERENCES "Feeder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutageReport" ADD CONSTRAINT "OutageReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutageReport" ADD CONSTRAINT "OutageReport_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutageReport" ADD CONSTRAINT "OutageReport_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_outageReportId_fkey" FOREIGN KEY ("outageReportId") REFERENCES "OutageReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianProfile" ADD CONSTRAINT "TechnicianProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorProfile" ADD CONSTRAINT "OperatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_feederId_fkey" FOREIGN KEY ("feederId") REFERENCES "Feeder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
