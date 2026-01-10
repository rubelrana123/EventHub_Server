 
import { EventStatus, PaymentMethod, PaymentStatus, Prisma, UserStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";import { fileUploader } from "../../helper/fileUploader";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { eventSearchableFields } from "./event.constant";
 
import { stripe } from "../../helper/stripe";
import { v4 as uuidv4 } from "uuid";
// ============================
// CREATE EVENT
// ============================
const createEvent = async (req : any) => {

  // ============================
  // FILE UPLOAD (like demo)
  // ============================
  if ((req as any).file) {
    const uploaded = await fileUploader.uploadToCloudinary((req as any).file);
    (req as any).body.bannerPhoto = uploaded?.secure_url;
  }

  const userEmail = (req as any).user.email;

  // ============================
  // START TRANSACTION (same as demo)
  // ============================
  const event = await prisma.$transaction(async (tnx) => {
    // -------------------------------------
    // 1. Validate Active User
    // -------------------------------------
    await tnx.user.findUniqueOrThrow({
      where: {
        email: userEmail,
        status: UserStatus.ACTIVE,
      },
    });

    // -------------------------------------
    // 2. User must be a Host
    // -------------------------------------
    const hostProfile = await tnx.host.findUnique({
      where: { email: userEmail },
    });

    if (!hostProfile) {
      throw new Error("You must be a Host to create an event");
    }

    // -------------------------------------
    // 3. Create Event (same pattern as demo)
    // -------------------------------------
    return await tnx.event.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        bannerPhoto: req.body.bannerPhoto || null,
        dateTime: req.body.dateTime,
        location: req.body.location,
        minParticipants: req.body.minParticipants,
        maxParticipants: req.body.maxParticipants,
        availableSeats : req.body.maxParticipants,
        joiningFee: req.body.joiningFee,
        eventType: req.body.eventType,

        hostId: hostProfile.id,
        createdByEmail: userEmail,
      },
      include: {
        host: true,
      },
    });
  });

  return event;
};


// ============================
// GET ALL EVENTS
// ============================
const getAllEvents = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.EventWhereInput[] = [];

  // ==============================
  // 1. Search (title, location, eventType)
  // ==============================
  if (searchTerm) {
    andConditions.push({
      OR: eventSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // ==============================
  // 2. Filtering (category, location, etc.)
  // ==============================
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // ==============================
  // Always exclude deleted events
  // ==============================
  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // ==============================
  // 3. Fetch events
  // ==============================
  const events = await prisma.event.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      host: true,
      participators: true,
      reviews: true,
    },
  });

  // ==============================
  // 4. Count for pagination
  // ==============================
  const total = await prisma.event.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: events,
  };
};


// ============================
// GET EVENT BY ID
// ============================
const getEventById = async (id: string) => {
  return await prisma.event.findUniqueOrThrow({
    where: { id },
    include: {
      host: true,
      participators: {
        include: { user: true },
      },
      reviews: true,
    },
  });
};

// ============================
// UPDATE EVENT
// ============================
const updateEvent = async (eventId: string, user: any, payload: any) => {
  const { email } = user;

  const host = await prisma.host.findUnique({
    where: { email },
  });

  if (!host) throw new Error("Only Hosts can update their events");

  // ensure the event belongs to this host
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  if (event.hostId !== host.id) {
    throw new Error("You are not allowed to update this event");
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: payload,
  });

  return updatedEvent;
};

// ============================
// DELETE EVENT (SOFT DELETE)
// ============================
const deleteEvent = async (eventId: string, user: any) => {
  const { email } = user;

  const host = await prisma.host.findUnique({
    where: { email },
  });

  if (!host) throw new Error("Only Hosts can delete their events");

  // ensure ownership
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  if (event.hostId !== host.id) {
    throw new Error("You are not allowed to delete this event");
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: { isDeleted: true },
  });
};

// ============================
// USER JOINS EVENT
// ============================
// const joinEvent = async (eventId: string, user: any) => {
//   const userId = user.id;

//   const event = await prisma.event.findUniqueOrThrow({
//     where: { id: eventId },
//     include: {
//       participators: true,
//     },
//   });

//   // Check max participants
//   if (
//     event.maxParticipants &&
//     event.participators.length >= event.maxParticipants
//   ) {
//     throw new Error("Event seats are full");
//   }

//   const participator = await prisma.participator.findUnique({
//     where: { email: user.email },
//   });

//   if (!participator) {
//     throw new Error("You must have a Participator profile to join an event");
//   }

//   const result = await prisma.eventParticipator.create({
//     data: {
//       eventId,
//       userId,
//       participatorId: participator.id,
//     },
//   });

//   return result;
// };
const joinEvent = async (eventId: string, user: any) => {
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
        transactionId: uuidv4()  ,
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
// ============================
// EXPORT
// ============================
export const EventService = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
};
