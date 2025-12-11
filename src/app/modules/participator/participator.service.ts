import {
  EventStatus,
  Participator,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  UserStatus,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";

import { participatorSearchableFields } from "./participator.constant";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { IJWTPayload } from "../../types";
import { stripe } from "../../helper/stripe";
import { v4 as uuidv4 } from "uuid";

const getAllParticipator = async (filters: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.ParticipatorWhereInput[] = [];

  // 🔍 Search
  if (searchTerm) {
    andConditions.push({
      OR: participatorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // 🎯 Filters
  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.ParticipatorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // 📌 Query
  const result = await prisma.participator.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy || "createdAt"]: sortOrder || "desc",
    },
    include: {
      reviews: true,
      eventParticipations: {
        include: {
          event: true, // ⭐ All joined event history
        },
      },
    },
  });

  const total = await prisma.participator.count({
    where: whereConditions,
  });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

/**

* Delete Participator
  */
const deleteParticipatorFromDB = async (id: string) => {
  return await prisma.participator.delete({
    where: { id },
  });
};

/**

* Update Participator Profile
  */
const updateIntoDB = async (user: IJWTPayload, payload: any) => {
  const allowedFields = ["name", "profilePhoto", "address", "interests", "bio"];

  const participatorData: any = {};

  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      participatorData[key] = payload[key];
    }
  }

  const participatorInfo = await prisma.participator.findUniqueOrThrow({
    where: {
      email: user.email,
      isDeleted: false,
    },
  });

  return await prisma.$transaction(async (tnx) => {
    await tnx.participator.update({
      where: { id: participatorInfo.id },
      data: participatorData,
    });

    return tnx.participator.findUnique({
      where: { id: participatorInfo.id },
      include: {
        reviews: true,
        eventParticipations: {
          include: {
            event: true,
          },
        },
      },
    });
  });
};

const getByIdFromDB = async (id: string): Promise<Participator | null> => {
  const result = await prisma.participator.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      reviews: true,
      eventParticipations: {
        include: {
          event: true,
        },
      },
    },
  });
  return result;
};
// ...existing code...
const createParticipation = async (eventId: string, user: any) => {
  const userEmail = user?.email;

  // 1. Validate user
  const dbUser = await prisma.user.findFirst({
    where: { email: userEmail, status: UserStatus.ACTIVE },
    include: { participator: true },
  });

  if (!dbUser) {
    throw new Error("User not found or inactive");
  }
  if (!dbUser.participator) {
    throw new Error("Only participators can join");
  }

  const userId = dbUser.id;
  const participatorId = dbUser.participator.id;

  // 2. Validate event
  const event = await prisma.event.findFirst({
    where: { id: eventId, isDeleted: false },
  });

  if (!event) throw new Error("Event not found");
  if (event.status === EventStatus.REGISTRATION_CLOSED)
    throw new Error("Registration closed");
  if (
    event.status === EventStatus.LIVE ||
    event.status === EventStatus.COMPLETED
  )
    throw new Error("You cannot join this event now");
  if (event.availableSeats !== null && event.availableSeats <= 0)
    throw new Error("No seats available");

  // 3. Prevent duplicate participation
  const alreadyJoined = await prisma.eventParticipator.findFirst({
    where: { eventId, userId },
  });

  if (alreadyJoined) {
    throw new Error("You already joined this event");
  }

  // 4. Transaction
  try {
const result = await prisma.$transaction(async (tx) => {
  const participation = await tx.eventParticipator.create({
    data: { eventId, userId, participatorId },
  });

  const transactionId = uuidv4();

  const payment = await tx.payment.create({
    data: {
      id: transactionId,
      eventId,
      userId,
      amount: event.joiningFee,
      status: PaymentStatus.UNPAID,
      method: PaymentMethod.STRIPE,
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: { name: `Event: ${event.title}` },
          unit_amount: event.joiningFee * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId: event.id,
      paymentId: payment.id,
      eventParticipatorId: participation.id,
    },
    success_url: `https://web.programming-hero.com/home/payment-success?eventId=${event.id}`,
    cancel_url: `https://next.programming-hero.com/payment-cancel?eventId=${event.id}`,
  });

  return {
    paymentUrl: session.url,
    participationId: participation.id,
    paymentId: payment.id,
  };
});


    return result;
  } catch (err) {
    throw err;
  }
};

// ...existing code...
export const ParticipatorService = {
  getAllParticipator,
  updateIntoDB,
  deleteParticipatorFromDB,
  getByIdFromDB,
  createParticipation,
};
