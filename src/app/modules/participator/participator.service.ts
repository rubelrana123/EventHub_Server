import {
  EventStatus,
  Participator,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  UserStatus,
} from "@prisma/client";
 
import { participatorSearchableFields } from "./participator.constant";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { IJWTPayload } from "../../types";
import { stripe } from "../../helper/stripe";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../shared/prisma";

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
console.log("hit create partition")
  // 1️⃣ Find user and participator
  const dbUser = await prisma.user.findFirst({
    where: { email: userEmail, status: UserStatus.ACTIVE },
    include: { participator: true },
  });
  if (!dbUser || !dbUser.participator)
    throw new Error("User not found or cannot participate");

  const userId = dbUser.id;
  const participatorId = dbUser.participator.id;

  // 2️⃣ Find event
  const event = await prisma.event.findFirst({ where: { id: eventId, isDeleted: false } });
  if (!event) throw new Error("Event not found");
  if (
    [EventStatus.LIVE, EventStatus.COMPLETED, EventStatus.REGISTRATION_CLOSED].includes(event.status as any)
  )
    throw new Error("Cannot join this event now");

  if (event.availableSeats !== null && event.availableSeats <= 0)
    throw new Error("No seats available");

  // 3️⃣ Check duplicate participation
  const alreadyJoined = await prisma.eventParticipator.findFirst({ where: { eventId, userId } });
  if (alreadyJoined) throw new Error("Already joined this event");

  // 4️⃣ Create participation and payment
  return await prisma.$transaction(async (tx) => {
    // Participation (seat reserved, not yet booked)
    const participation = await tx.eventParticipator.create({
      data: { eventId, userId, participatorId },
    });
console.log("create partition")
    // Payment record (UNPAID)
    const payment = await tx.payment.create({
      data: {
        eventParticipationId: participation.id,
        eventId,
        userId,
        amount: event.joiningFee,
        status: PaymentStatus.UNPAID,
        method: PaymentMethod.STRIPE,
        transactionId: uuidv4(),
      },
    });
console.log("create paynent")
    // 5️⃣ Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
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
console.log("create session payment",session)
    return {
      paymentUrl: session.url,
      participationId: participation.id,
      paymentId: payment.id,
    };
  });
};
// ...existing code...
export const ParticipatorService = {
  getAllParticipator,
  updateIntoDB,
  deleteParticipatorFromDB,
  getByIdFromDB,
  createParticipation,
};
