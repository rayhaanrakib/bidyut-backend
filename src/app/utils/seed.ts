import bcrypt from "bcrypt";
import config from "../config";
import { prisma } from "../lib/prisma";

const hash = (pw: string) => bcrypt.hash(pw, config.bcryptSaltRounds);

async function seedDemoGrid() {
  // 1) demo grid: Zone -> Substation -> Feeder -> Area
  const zone = await prisma.zone.upsert({
    where: { name: "Dhaka Central" },
    update: {},
    create: { name: "Dhaka Central", code: "DHK-C" },
  });
  const substation = await prisma.substation.upsert({
    where: { zoneId_name: { zoneId: zone.id, name: "Mirpur Substation" } },
    update: {},
    create: { name: "Mirpur Substation", zoneId: zone.id },
  });
  const feeder = await prisma.feeder.upsert({
    where: { substationId_name: { substationId: substation.id, name: "Feeder 11" } },
    update: {},
    create: { name: "Feeder 11", substationId: substation.id, capacityMW: 33 },
  });
  const area = await prisma.area.upsert({
    where: { feederId_name: { feederId: feeder.id, name: "Mirpur 10" } },
    update: {},
    create: { name: "Mirpur 10", feederId: feeder.id },
  });
  return { zone, area };
}

// the FIRST admin
async function seedFirstAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: config.seed.admin.email } });
  if (existing) {
    console.log("ℹ️  First admin already exists — skipped");
    return;
  }
  await prisma.user.create({
    data: {
      name: config.seed.admin.name,
      email: config.seed.admin.email,
      passwordHash: await hash(config.seed.admin.password),
      role: "ADMIN",
      emailVerified: true,
      adminProfile: { create: { employeeId: "ADM-0001", designation: "System Administrator" } },
    },
  });
  console.log(`👑 First admin created: ${config.seed.admin.email}`);
}

// the FIRST operator
async function seedFirstOperator() {
  const existing = await prisma.user.findUnique({ where: { email: config.seed.operator.email } });
  if (existing) {
    console.log("ℹ️  First operator already exists — skipped");
    return;
  }
  await prisma.user.create({
    data: {
      name: config.seed.operator.name,
      email: config.seed.operator.email,
      passwordHash: await hash(config.seed.operator.password),
      role: "POWER_OPERATOR",
      emailVerified: true,
      operatorProfile: {
        create: {
          employeeId: "OPS-0001",
          designation: "Control Room Operator",
          shift: "MORNING" as any,
        },
      },
    },
  });
  console.log(`🛠️  First operator created: ${config.seed.operator.email}`);
}

// the demo technician — created AS the seeded operator
async function seedDemoTechnician() {
  const existing = await prisma.user.findUnique({ where: { email: config.seed.technician.email } });
  if (existing) return;

  const operator = await prisma.user.findFirst({
    where: { role: "POWER_OPERATOR", isDeleted: false },
  });
  if (!operator) return; // no operator yet — skip quietly

  const technician = await prisma.user.create({
    data: {
      name: config.seed.technician.name,
      email: config.seed.technician.email,
      passwordHash: await hash(config.seed.technician.password),
      role: "FIELD_TECHNICIAN",
      emailVerified: true,
    },
  });
  await prisma.technicianProfile.create({
    data: {
      userId: technician.id,
      employeeId: "DES-0001",
      specialization: "LINE",
      experienceYears: 4,
      phone: "01700000001",
    },
  });
  await prisma.activityLog.create({
    data: {
      action: "STAFF_ACCOUNT_CREATED",
      entity: "User",
      entityId: technician.id,
      actorId: operator.id,
      metadata: { role: "FIELD_TECHNICIAN", seeded: true } as any,
    },
  });
  console.log(
    `👷 Demo technician created (by the seeded operator): ${config.seed.technician.email}`,
  );
}

// one demo customer attached to the demo area
async function seedDemoCustomer(areaId: string) {
  await prisma.user.upsert({
    where: { email: config.seed.customer.email },
    update: {},
    create: {
      name: config.seed.customer.name,
      email: config.seed.customer.email,
      passwordHash: await hash(config.seed.customer.password),
      role: "CUSTOMER",
      areaId,
      emailVerified: true,
      customerProfile: {
        create: {
          serviceAddress: "House 12, Road 7, Block C",
          thana: "Mirpur",
          city: "Dhaka",
          postalCode: "1216",
          preferredLanguage: "en",
        },
      },
    },
  });
}

export async function seed() {
  const { area } = await seedDemoGrid();
  await seedFirstAdmin();
  await seedFirstOperator();
  await seedDemoTechnician();
  await seedDemoCustomer(area.id);
  console.log("✅ Seed complete — demo users + grid data ready");
}
