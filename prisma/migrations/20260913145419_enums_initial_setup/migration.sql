-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CUSTOMER', 'FIELD_TECHNICIAN', 'POWER_OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "user_category" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'HEALTHCARE', 'EDUCATION');

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('CREDENTIAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "technician_specialization" AS ENUM ('LINE', 'TRANSFORMER', 'METERING', 'GENERATION');

-- CreateEnum
CREATE TYPE "operator_shift" AS ENUM ('MORNING', 'EVENING', 'NIGHT');

-- CreateEnum
CREATE TYPE "outage_status" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "schedule_type" AS ENUM ('PLANNED', 'MAINTENANCE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "schedule_status" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('PRIORITY_RESTORATION', 'SLA_SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');
