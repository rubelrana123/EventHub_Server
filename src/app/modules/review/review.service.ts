import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../helper/ApiError";
import { IJWTPayload } from "../../types";
import { IPaginationOptions } from "../../types/pagination";
import { paginationHelper } from "../../helper/paginationHelper";
 
const insertIntoDB = async (user: IJWTPayload, payload: any) => {
  // 1. Verify participator exists
  const participator = await prisma.participator.findUniqueOrThrow({
    where: { email: user.email },
  });

  // 2. Validate event participator record (payload.eventId is eventParticipatorId)
  const eventParticipator = await prisma.eventParticipator.findUniqueOrThrow({
    where: { id: payload.eventId },
  });

  // 3. Ensure user is reviewing their own participation
  if (eventParticipator.participatorId !== participator.id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You are not allowed to review this event!"
    );
  }

  // 4. Fetch full event data to locate event + host
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventParticipator.eventId },
    select: { id: true, hostId: true },
  });

  if (!event.hostId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This event does not have a host assigned."
    );
  }

  // 5. Insert review + update host rating inside a transaction
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        rating: payload.rating,
        comment: payload.comment,
        eventId: event.id,
        participatorId: participator.id,
        userId: user.id ?? null, // optional
      },
    });

    // 6. Recalculate host average rating
    const hostEvents = await tx.event.findMany({
      where: { hostId: event.hostId },
      select: { id: true },
    });

    const hostEventIds = hostEvents.map((ev) => ev.id);

    const aggregated = await tx.review.aggregate({
      where: { eventId: { in: hostEventIds } },
      _avg: { rating: true },
    });

    await tx.host.update({
      where: { id: event.hostId  as string},
      data: {
        // fallback to 0 if no reviews yet
        averageRating: aggregated._avg.rating ?? 0,
      },
    });

    return review;
  });
};



const getAllFromDB = async (
  filters: any,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const { participatorEmail, eventId, userEmail } = filters;

  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (participatorEmail) {
    andConditions.push({
      participator: { email: participatorEmail },
    });
  }

  if (eventId) {
    andConditions.push({
      eventId,
    });
  }

  if (userEmail) {
    andConditions.push({
      user: { email: userEmail },
    });
  }

  const whereConditions: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.review.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: options.sortBy
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: "desc" },
    include: {
      event: true,
      participator: true,
      user: true,
    },
  });

  const total = await prisma.review.count({
    where: whereConditions,
  });

  return {
    meta: { total, page, limit },
    data: result,
  };
};


export const ReviewService = {
  insertIntoDB,
  getAllFromDB,
};
