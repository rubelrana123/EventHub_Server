import { Prisma, Host, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../helper/paginationHelper";
import { IHostFilterRequest, IHostUpdate } from "./host.interface";
import { prisma } from "../../shared/prisma";

// =========================
// GET ALL HOSTS
// =========================
const getAllFromDB = async (
  filters: IHostFilterRequest,
  options: any
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.HostWhereInput[] = [];

  // 🔍 SEARCH
  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  // 🎯 DIRECT FILTERS
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: { equals: value },
      })),
    });
  }

  // Only show active hosts
  andConditions.push({ isDeleted: false });

  const whereConditions: Prisma.HostWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.host.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },

    include: {
      // Host created events
      events: {
        include: {
          reviews: true,
          participators: true,
        },
      }, 
      // Linked User
      user: true,
    },
  });

  const total = await prisma.host.count({
    where: whereConditions,
  });

  return {
    meta: { total, page, limit },
    data: result,
  };
};

// =========================
// GET BY ID
// =========================
const getByIdFromDB = async (id: string) => {
  const result = await prisma.host.findUnique({
    where: { id, isDeleted: false },
    include: {
      events: {
        include: {
          reviews: true,
          participators: {
            include: {
              user: true,
            },
          },
        },
      },
      user: true,
    },
  });

  return result;
};

// =========================
// UPDATE HOST PROFILE
// =========================
const updateIntoDB = async (id: string, payload: IHostUpdate) => {
  const host = await prisma.host.findUniqueOrThrow({
    where: { id, isDeleted: false },
  });

  const result = await prisma.host.update({
    where: { id },
    data: payload,
    include: {
      events: true, 
      user: true,
    },
  });

  return result;
};

// =========================
// HARD DELETE HOST
// =========================
const deleteFromDB = async (id: string): Promise<Host> => {
  return await prisma.$transaction(async (tx) => {
    const deletedHost = await tx.host.delete({
      where: { id },
    });

    await tx.user.delete({
      where: { email: deletedHost.email },
    });

    return deletedHost;
  });
};

// =========================
// SOFT DELETE HOST
// =========================
const softDelete = async (id: string) => {
  return await prisma.$transaction(async (tx) => {
    const deletedHost = await tx.host.update({
      where: { id },
      data: { isDeleted: true },
    });

    await tx.user.update({
      where: { email: deletedHost.email },
      data: { status: UserStatus.DELETED },
    });

    return deletedHost;
  });
};

// =========================
// PUBLIC HOST LIST
// =========================
const getAllPublic = async (
  filters: IHostFilterRequest,
  options: any
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions: Prisma.HostWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  andConditions.push({ isDeleted: false });

  const result = await prisma.host.findMany({
    where: { AND: andConditions },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },

    select: {
      id: true,
      name: true,
      profilePhoto: true,
      contactNumber: true,
      address: true,
      createdAt: true,
      updatedAt: true,

      // Event list (public)
      events: {
        select: {
          id: true,
          title: true,
          bannerPhoto: true,
          dateTime: true,
          location: true,
          eventType: true,
          createdAt: true,
          updatedAt: true,
        },
      }, 
    },
  });

  const total = await prisma.host.count({
    where: { AND: andConditions },
  });

  return {
    meta: { total, page, limit },
    data: result,
  };
};

export const HostService = {
  getAllFromDB,
  getByIdFromDB,
  updateIntoDB,
  deleteFromDB,
  softDelete,
  getAllPublic,
};
