 
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const seedAdmin = async () => {
  try {
    console.log("🌱 Trying to create   Admin...");

    const email = process.env.SUPER_ADMIN_EMAIL as string;
    const password = process.env.SUPER_ADMIN_PASSWORD as string;
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUND) || 10;

    // Check if already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("⚠️ Super Admin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ✅ Use a transaction to ensure atomic creation
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.ADMIN,
          needPasswordChange: false,
          status: UserStatus.ACTIVE,
        },
      });

      // 2️⃣ Create admin linked by email
      await tx.admin.create({
        data: {
          name: "Super Admin",
          email: user.email,
          contactNumber: "+1234567890",
          profilePhoto: "https://res.cloudinary.com/dddbgbwmk/image/upload/v1763059574/file-1763059572353-78202584.jpg" 
        },
      });
    });

    console.log("✅ Super Admin seeded successfully.");
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error);
  } finally {
    await prisma.$disconnect();
  }
};