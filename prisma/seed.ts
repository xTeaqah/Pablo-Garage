import { PrismaClient } from "@prisma/client";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME?.trim() || "Pablo";
  const resetAuth = process.env.SEED_RESET_AUTH === "true";
  const passwordHash =
    adminPassword && resetAuth
      ? await bcrypt.hash(adminPassword, 12)
      : undefined;

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      ...(passwordHash ? { passwordHash, adminUsername } : { adminUsername }),
    },
    create: {
      id: "default",
      businessName: "Pablo Auto's",
      address: "42 Workshop Lane\nManchester\nM1 2AB",
      phone: "07700 900123",
      email: "mo@mosgarage.co.uk",
      defaultLaborRate: 45,
      invoicePrefix: "MG",
      nextInvoiceNumber: 1,
      paymentTermsDays: 14,
      sortCode: "20-00-00",
      accountNumber: "55779911",
      adminUsername,
      passwordHash: passwordHash ?? "",
    },
  });

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "John Smith",
        phone: "07700 900456",
        email: "john.smith@email.com",
        address: "15 Oak Avenue, Manchester, M2 3CD",
        vehicles: {
          create: {
            registration: "AB12 CDE",
            make: "Ford",
            model: "Focus",
            year: 2018,
            mileage: 62000,
            color: "Blue",
          },
        },
      },
      include: { vehicles: true },
    }),
    prisma.customer.create({
      data: {
        name: "Sarah Jones",
        phone: "07700 900789",
        email: "sarah.j@email.com",
        vehicles: {
          create: {
            registration: "XY99 ZZZ",
            make: "Vauxhall",
            model: "Corsa",
            year: 2020,
            mileage: 34000,
            color: "White",
          },
        },
      },
      include: { vehicles: true },
    }),
    prisma.customer.create({
      data: {
        name: "Dave Wilson",
        phone: "07700 900321",
        vehicles: {
          create: {
            registration: "MK67 FGH",
            make: "BMW",
            model: "3 Series",
            year: 2017,
            mileage: 89000,
          },
        },
      },
      include: { vehicles: true },
    }),
    prisma.customer.create({
      data: {
        name: "Emma Taylor",
        phone: "07700 900654",
        email: "emma.t@email.com",
        vehicles: {
          create: [
            {
              registration: "LP20 ABC",
              make: "Volkswagen",
              model: "Golf",
              year: 2020,
              mileage: 28000,
            },
            {
              registration: "OLD1 CAR",
              make: "Mini",
              model: "Cooper",
              year: 2015,
              mileage: 72000,
            },
          ],
        },
      },
      include: { vehicles: true },
    }),
  ]);

  const today = startOfDay(new Date());
  const todayMorning = setMinutes(setHours(today, 9), 30);
  const todayAfternoon = setMinutes(setHours(today, 14), 0);
  const tomorrow = addDays(today, 1);
  const tomorrowMorning = setMinutes(setHours(tomorrow, 10), 0);
  const yesterday = addDays(today, -1);

  const job1 = await prisma.job.create({
    data: {
      customerId: customers[0].id,
      vehicleId: customers[0].vehicles[0].id,
      description: "Front brake pads and discs replacement",
      status: "IN_PROGRESS",
      scheduledAt: todayMorning,
      startedAt: todayMorning,
      total: 285,
      lineItems: {
        create: [
          {
            type: "LABOR",
            description: "Brake pad and disc replacement (front)",
            quantity: 2,
            unitPrice: 45,
            lineTotal: 90,
            sortOrder: 0,
          },
          {
            type: "PART",
            description: "Front brake pads (pair)",
            quantity: 1,
            unitPrice: 35,
            lineTotal: 35,
            sortOrder: 1,
          },
          {
            type: "PART",
            description: "Front brake discs (pair)",
            quantity: 1,
            unitPrice: 85,
            lineTotal: 85,
            sortOrder: 2,
          },
          {
            type: "PART",
            description: "Brake fluid top-up",
            quantity: 1,
            unitPrice: 15,
            lineTotal: 15,
            sortOrder: 3,
          },
          {
            type: "LABOR",
            description: "Road test and bedding in",
            quantity: 1.25,
            unitPrice: 45,
            lineTotal: 56.25,
            sortOrder: 4,
          },
        ],
      },
    },
  });

  await prisma.job.create({
    data: {
      customerId: customers[1].id,
      vehicleId: customers[1].vehicles[0].id,
      description: "Full service and MOT preparation",
      status: "SCHEDULED",
      scheduledAt: todayAfternoon,
      total: 195,
      lineItems: {
        create: [
          {
            type: "LABOR",
            description: "Full service",
            quantity: 2.5,
            unitPrice: 45,
            lineTotal: 112.5,
            sortOrder: 0,
          },
          {
            type: "PART",
            description: "Oil filter",
            quantity: 1,
            unitPrice: 12,
            lineTotal: 12,
            sortOrder: 1,
          },
          {
            type: "PART",
            description: "Engine oil (5W-30)",
            quantity: 1,
            unitPrice: 35,
            lineTotal: 35,
            sortOrder: 2,
          },
          {
            type: "LABOR",
            description: "MOT pre-check",
            quantity: 0.75,
            unitPrice: 45,
            lineTotal: 33.75,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  await prisma.job.create({
    data: {
      customerId: customers[2].id,
      vehicleId: customers[2].vehicles[0].id,
      description: "Clutch replacement",
      status: "WAITING_PARTS",
      scheduledAt: tomorrowMorning,
      total: 650,
      notes: "Clutch kit ordered from Euro Car Parts — ETA tomorrow",
      lineItems: {
        create: [
          {
            type: "LABOR",
            description: "Clutch replacement",
            quantity: 6,
            unitPrice: 45,
            lineTotal: 270,
            sortOrder: 0,
          },
          {
            type: "PART",
            description: "Clutch kit (LUK)",
            quantity: 1,
            unitPrice: 280,
            lineTotal: 280,
            sortOrder: 1,
          },
          {
            type: "PART",
            description: "Flywheel resurface",
            quantity: 1,
            unitPrice: 60,
            lineTotal: 60,
            sortOrder: 2,
          },
          {
            type: "PART",
            description: "Gearbox oil",
            quantity: 1,
            unitPrice: 40,
            lineTotal: 40,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  const completedJob = await prisma.job.create({
    data: {
      customerId: customers[3].id,
      vehicleId: customers[3].vehicles[0].id,
      description: "Tyre replacement (2 front)",
      status: "COMPLETE",
      scheduledAt: yesterday,
      completedAt: yesterday,
      total: 220,
      lineItems: {
        create: [
          {
            type: "LABOR",
            description: "Tyre fitting and balancing (×2)",
            quantity: 1,
            unitPrice: 30,
            lineTotal: 30,
            sortOrder: 0,
          },
          {
            type: "PART",
            description: "Michelin Pilot Sport 4 (225/45 R17) ×2",
            quantity: 2,
            unitPrice: 95,
            lineTotal: 190,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  const paidJob = await prisma.job.create({
    data: {
      customerId: customers[0].id,
      vehicleId: customers[0].vehicles[0].id,
      description: "Battery replacement",
      status: "PAID",
      scheduledAt: addDays(today, -3),
      completedAt: addDays(today, -3),
      total: 145,
      lineItems: {
        create: [
          {
            type: "LABOR",
            description: "Battery test and replacement",
            quantity: 0.5,
            unitPrice: 45,
            lineTotal: 22.5,
            sortOrder: 0,
          },
          {
            type: "PART",
            description: "Bosch S5 battery",
            quantity: 1,
            unitPrice: 122.5,
            lineTotal: 122.5,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      jobId: paidJob.id,
      invoiceNumber: "MG-2026-0001",
      status: "PAID",
      issuedAt: addDays(today, -3),
      dueAt: addDays(today, 11),
      paidAt: addDays(today, -2),
      subtotal: 145,
      total: 145,
    },
  });

  await prisma.settings.update({
    where: { id: "default" },
    data: { nextInvoiceNumber: 2 },
  });

  console.log("Seed complete!");
  console.log(`- ${customers.length} customers`);
  console.log(`- 5 jobs (including 1 in progress today, 1 complete)`);
  console.log(`- 1 paid invoice`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
