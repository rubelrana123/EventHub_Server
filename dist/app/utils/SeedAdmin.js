"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🌱 Trying to create   Admin...");
        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUND) || 10;
        // Check if already exists
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.log("⚠️ Super Admin already exists.");
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, saltRounds);
        // ✅ Use a transaction to ensure atomic creation
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1️⃣ Create user
            const user = yield tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: client_1.UserRole.ADMIN,
                    needPasswordChange: false,
                    status: client_1.UserStatus.ACTIVE,
                },
            });
            // 2️⃣ Create admin linked by email
            yield tx.admin.create({
                data: {
                    name: "Super Admin",
                    email: user.email,
                    contactNumber: "+1234567890",
                    profilePhoto: "https://res.cloudinary.com/dddbgbwmk/image/upload/v1763059574/file-1763059572353-78202584.jpg"
                },
            });
        }));
        console.log("✅ Super Admin seeded successfully.");
    }
    catch (error) {
        console.error("❌ Error seeding Super Admin:", error);
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.seedAdmin = seedAdmin;
