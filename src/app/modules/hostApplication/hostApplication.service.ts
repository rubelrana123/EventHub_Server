import { Prisma, PrismaClient } from "@prisma/client";
import { paginationHelper } from "../../helper/paginationHelper";
const prisma = new PrismaClient();

/**
 * User (Participator) applies to become a Host
 */
 const applyForHost = async (user: any, message?: string) => {
  console.log(user, "user from service" , message);
  // // check if already applied
 const isExistinguser = await prisma.user.findUnique({
    where: { email: user?.email },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const isExistApplication = await prisma.hostApplication.findFirst({
    where: {
      userId: isExistinguser?.id,
      status: "PENDING",
    },
  });

  const participator = await prisma.participator.findUnique({
  where: { email: user?.email },
   });

  if (!participator) {
  throw new Error("Participator profile not found for this user.");
  } 


  if (isExistApplication) {
    throw new Error("You already have a pending host application.");
  }

  // // create new application
  return await prisma.hostApplication.create({
    data: {
      userId : isExistinguser?.id as string,
      participatorId : participator?.id,
      message,
    },
  });
};


/**
 * ADMIN → Approve Host Application
 */
  const processHostApplication = async (
  applicationId: string,
  action: "APPROVED" | "REJECTED",
  adminEmail: string,
  adminNote?: string
) => {
  const application = await prisma.hostApplication.findUnique({
    where: { id: applicationId },
    include: { user: true, participator: true },
  });

  if (!application) throw new Error("Application not found.");
  if (application.status !== "PENDING") throw new Error("Application already processed.");

  // ================================
  // REJECT LOGIC
  // ================================
  if (action === "REJECTED") {
    await prisma.hostApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        adminEmail,
        adminNote,
      },
    });

    return { message: "Application rejected successfully." };
  }

  // ================================
  // APPROVE LOGIC
  // ================================
  if (action === "APPROVED") {
    // 1) Update application
    await prisma.hostApplication.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        adminEmail,
        adminNote,
      },
    });

    // 2) Create HOST
    await prisma.host.create({
      data: {
        email: application.user.email,
        name: application.participator.name,
        profilePhoto: application.participator.profilePhoto,
        contactNumber: application.participator.contactNumber ?? "",
        address: application.participator.address ?? "",
      },
    });

    // 3) Update User Role
    await prisma.user.update({
      where: { id: application.userId },
      data: {
        role: "HOST",
      },
    });

    return { message: "Application approved & user is now a HOST." };
  }

  throw new Error("Invalid action.");
};



/**
 * ADMIN → Get ALL applications
 */
 
 const getAllHostApplications = async (
  filters: any,
  options: any
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.HostApplicationWhereInput[] = [];

  // 🔍 SEARCHABLE FIELDS (searchTerm)
  if (searchTerm) {
    andConditions.push({
      OR: [
        // { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  // 🎯 DIRECT FILTER FIELDS (status, userId, adminId, etc.)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    });
  }

  // ❗ Only fetch non-deleted applications (if you have soft delete)
  andConditions.push({ isDeleted: false, status: { in: ["PENDING", "REJECTED"] } });

  const whereConditions: Prisma.HostApplicationWhereInput = {
    AND: andConditions,
  };

  // 📌 QUERY HOST APPLICATIONS
  const result = await prisma.hostApplication.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },

    include: {
      user: true,
      admin: true,
      participator: true,
    },
  });

  // 📌 TOTAL COUNT
  const total = await prisma.hostApplication.count({
    where: whereConditions,
  });

  return {
    meta: { total, page, limit },
    data: result,
  };
};



/**
 * USER → Get their own application history
 */
export const getUserHostApplications = async (userId: string) => {
  return prisma.hostApplication.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};


/**
 * ADMIN → Get single host application
 */
export const getHostApplicationById = async (applicationId: string) => {
  return prisma.hostApplication.findUnique({
    where: { id: applicationId },
    include: {
      user: true,
      participator: true,
      admin: true,
    },
  });
};

const deleteHostApplication = async (applicationId: string) => {
    return prisma.hostApplication.update({  
        where: { id: applicationId },
        data: { isDeleted: true },
    });
}

 

export const HostApplicationService = {
  applyForHost,
  processHostApplication, 
  getUserHostApplications,
  getHostApplicationById,
  getAllHostApplications,
  deleteHostApplication
};