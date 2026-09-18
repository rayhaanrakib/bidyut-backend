-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "TechnicianProfile" ADD COLUMN     "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "resumePublicId" TEXT,
ADD COLUMN     "resumeUrl" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ALTER COLUMN "employeeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TechnicianProfile" ADD CONSTRAINT "TechnicianProfile_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
