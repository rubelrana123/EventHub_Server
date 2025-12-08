import { UserStatus } from "@prisma/client"
import { prisma } from "../../shared/prisma"
import bcrypt from "bcryptjs";
import { jwtHelper } from "../../helper/jwtHelper";

const login = async (payload: { email: string, password: string }) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        }
    })

    const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
    if (!isCorrectPassword) {
        throw new Error("Password is incorrect!")
    }

    const accessToken = jwtHelper.generateToken({ email: user.email, role: user.role }, "abcd", "10d");

    const refreshToken = jwtHelper.generateToken({ email: user.email, role: user.role }, "abcdefgh", "90d");
    console.log(accessToken, refreshToken, "token fron service")
    return {
        accessToken,
        refreshToken,
        needPasswordChange: user.needPasswordChange
    }
}

const getMe = async (user: any) => {
  const accessToken = user.accessToken;
  const decodedData = jwtHelper.verifyToken(
    accessToken, 
    "abcd"
  );

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      role: true,
      needPasswordChange: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      // ADMIN PROFILE
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      // HOST PROFILE
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          address: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,

          // Host's Events
          events: {
            include: {
              participators: {
                include: {
                  user: true,
                },
              },
              reviews: true,
            },
          },
        },
      },

      // PARTICIPATOR PROFILE
      participator: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          address: true,
          interests: true,
          bio: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,

          // Reviews given about this participator
          reviews: true,
        },
      },

      // Reviews written by this user
      reviews: true,

      // Events created by this user (as creator)
      events: true,

      // User's participations (joined events)
      eventParticipations: {
        include: {
          event: true,
        },
      },

      // Payments made by this user
      payments: true,
    },
  });

  return userData;
};



export const AuthService = {
    login,
    getMe
}