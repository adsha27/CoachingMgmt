import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const admin = {
  name: process.env.ADMIN_NAME ?? "Local Admin",
  email: process.env.ADMIN_EMAIL ?? "admin@example.test",
  phone: process.env.ADMIN_PHONE ?? "0000000000",
};

try {
  const user = await prisma.user.upsert({
    where: { email: admin.email },
    update: {
      name: admin.name,
      phone: admin.phone,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Admin ready: ${user.email} (${user.id})`);
} finally {
  await prisma.$disconnect();
}
