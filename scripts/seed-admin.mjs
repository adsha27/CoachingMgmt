import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: false });

const prisma = new PrismaClient();

const admin = {
  name: process.env.ADMIN_NAME ?? "Local Admin",
  email: process.env.ADMIN_EMAIL ?? "admin@example.test",
  phone: process.env.ADMIN_PHONE ?? "0000000000",
};

// Setting ADMIN_PASSWORD also clears any lockout, so this doubles as the
// password-reset path while there's no forgot-password flow.
const password = process.env.ADMIN_PASSWORD
  ? {
      password: await bcryptjs.hash(process.env.ADMIN_PASSWORD, 10),
      loginAttempts: 0,
      lockedUntil: null,
    }
  : {};

try {
  const user = await prisma.user.upsert({
    where: { email: admin.email },
    update: {
      name: admin.name,
      phone: admin.phone,
      role: "ADMIN",
      status: "ACTIVE",
      ...password,
    },
    create: {
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: "ADMIN",
      status: "ACTIVE",
      ...password,
    },
  });

  console.log(
    `Admin ready: ${user.email} (${user.id})${process.env.ADMIN_PASSWORD ? " — password set" : " — no ADMIN_PASSWORD given, password unchanged"}`,
  );
} finally {
  await prisma.$disconnect();
}
