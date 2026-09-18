import type { User } from "../../../../generated/prisma/client";
import config from "../../config";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { logActivity } from "../../utils/activity";
import { getPagination } from "../../utils/pagination";
import type { ReportOutageInput } from "./outage.interface";

const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: [],
  CANCELLED: [],
};

const reportInclude = {
  area: {
    select: {
      id: true,
      name: true,
      feeder: { select: { id: true, name: true } },
    },
  },
  customer: { select: { id: true, name: true, email: true, category: true } },
  technician: { select: { id: true, name: true, email: true } },
};

// report outage post request
export const reportOutage = async (customer: User, input: ReportOutageInput) => {
  const area = await prisma.area.findFirst({
    where: { id: input.areaId, isDeleted: false },
  });
  if (!area) throw new AppError(404, "Area not found");

  // ---- priority flag ----
  const slaValid =
    customer.slaActive && customer.slaExpiryDate && customer.slaExpiryDate > new Date();

  const isPriority =
    Boolean(slaValid) || customer.category === "HEALTHCARE" || customer.category === "EDUCATION";

  const report = await prisma.outageReport.create({
    data: {
      title: input.title,
      description: input.description,
      areaId: input.areaId,
      customerId: customer.id,
      isPriority,
    },
  });

  // log priority flag activity
  if (isPriority) {
    await logActivity("PRIORITY_FLAGGED", "OutageReport", report.id, customer.id, {
      reason: slaValid ? "SLA" : customer.category,
    });
  }
  // ---- bulk incident detection ----

  const windowStart = new Date(Date.now() - config.bulk.windowMinutes * 60_000);

  const recent = await prisma.outageReport.findMany({
    where: {
      areaId: input.areaId,
      status: "PENDING",
      reportedAt: {
        gte: windowStart,
      },
    },
    distinct: ["customerId"],
  });

  if (recent.length >= config.bulk.threshold) {
    await prisma.outageReport.updateMany({
      where: {
        areaId: input.areaId,
        status: "PENDING",
        reportedAt: {
          gte: windowStart,
        },
      },
      data: {
        isBulkIncident: true,
      },
    });

    await logActivity("BULK_OUTAGE_DETECTED", "OutageReport", report.id, customer.id, {
      areaId: input.areaId,
      distinctReports: recent.length,
    });

    const operator = await prisma.user.findFirst({
      where: {
        role: "POWER_OPERATOR",
        isDeleted: false,
      },
    });

    if (operator) {
      await sendEmail(operator.email, "🚨 Bulk outage detected", "outage-alert", {
        areaName: area.name,
        count: recent.length,
      }).catch(() => null);
    }
  }

  return report;
};
// list outage reports for a user - get request
export const listForRole = async (user: User, query: Record<string, unknown>) => {
  const { limit, skip, sortBy, sortOrder, meta } = getPagination(query, "reportedAt");
  const where: any = {};
  if (user.role === "CUSTOMER") where.customerId = user.id;
  if (user.role === "FIELD_TECHNICIAN") where.technicianId = user.id;

  if (query.status) where.status = query.status;
  if (query.areaId) where.areaId = query.areaId;
  if (query.isPriority) where.isPriority = query.isPriority === "true";
  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: "insensitive" } },
      { title: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const orderBy: any = !query.sortBy
    ? [{ isPriority: "desc" }, { reportedAt: sortOrder }]
    : { [sortBy]: sortOrder };

  const [total, items] = await Promise.all([
    prisma.outageReport.count({ where }),
    prisma.outageReport.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: reportInclude,
    }),
  ]);
  return { items, meta: meta(total) };
};

// get outage report by id - get request
export const getByIdScoped = async (user: User, id: string) => {
  const report = await prisma.outageReport.findUnique({
    where: { id },
    include: reportInclude,
  });
  if (!report) throw new AppError(404, "Outage report not found");

  const isStaff = user.role === "ADMIN" || user.role === "POWER_OPERATOR";
  const isOwner = report.customerId === user.id;
  const isAssignedTech = report.technicianId === user.id;
  if (!isStaff && !isOwner && !isAssignedTech)
    throw new AppError(403, "You cannot view this report");
  return report;
};

// update outage status
export const updateStatus = async (actor: User, reportId: string, newStatus: string) => {
  const report = await prisma.outageReport.findUnique({
    where: { id: reportId },
  });
  if (!report) throw new AppError(404, "Outage report not found");

  if (actor.role === "FIELD_TECHNICIAN" && report.technicianId !== actor.id) {
    throw new AppError(403, "This report is not assigned to you");
  }

  const allowed = NEXT_STATUSES[report.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      409,
      `Invalid transition: ${report.status} → ${newStatus}. Allowed: ${allowed.join(", ") || "none"}`,
    );
  }

  const data: any = { status: newStatus };
  if (newStatus === "RESOLVED") data.resolvedAt = new Date();

  const updated = await prisma.outageReport.update({
    where: { id: reportId },
    data,
  });
  await logActivity(`OUTAGE_${newStatus}`, "OutageReport", reportId, actor.id);
  return updated;
};

// assign technician to outage report - patch request
export const assignTechnician = async (actor: User, reportId: string, technicianId: string) => {
  const report = await prisma.outageReport.findUnique({
    where: { id: reportId },
  });
  if (!report) throw new AppError(404, "Outage report not found");
  if (report.status !== "PENDING")
    throw new AppError(409, `Cannot assign — report is already ${report.status}`);

  const technician = await prisma.user.findFirst({
    where: { id: technicianId, role: "FIELD_TECHNICIAN", isDeleted: false },
  });
  if (!technician) throw new AppError(404, "Technician not found");

  const updated = await prisma.outageReport.update({
    where: { id: reportId },
    data: { status: "ASSIGNED", technicianId, assignedAt: new Date() },
  });
  await logActivity("OUTAGE_ASSIGNED", "OutageReport", reportId, actor.id, {
    technicianId,
  });
  return updated;
};

export const cancelOwnReport = async (customerId: string, reportId: string) => {
  const report = await prisma.outageReport.findUnique({
    where: { id: reportId },
  });
  if (!report) throw new AppError(404, "Outage report not found");
  if (report.customerId !== customerId) throw new AppError(403, "This is not your report");
  if (report.status !== "PENDING") throw new AppError(409, "Only PENDING reports can be cancelled");

  const updated = await prisma.outageReport.update({
    where: { id: reportId },
    data: { status: "CANCELLED" },
  });
  await logActivity("OUTAGE_CANCELLED", "OutageReport", reportId, customerId);
  return updated;
};
