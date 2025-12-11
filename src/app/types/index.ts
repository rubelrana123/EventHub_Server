import { UserRole } from "@prisma/client";

 

export type IJWTPayload = {
    id? : string;
    email: string;
    role: UserRole;
}