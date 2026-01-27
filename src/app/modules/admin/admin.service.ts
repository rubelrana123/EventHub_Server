import { Admin, Prisma } from "@prisma/client";
 
import { adminSearchableFields } from "./admin.constant";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { prisma } from "../../shared/prisma"; 

const getAllAdmin = async (filters: any, options: IOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
      const { searchTerm, ...filterData } = filters;
  
      const andConditions: Prisma.AdminWhereInput[] = [];

   console.log(searchTerm, "here searchterm", andConditions);
   // SEARCHING
      if (searchTerm) {
          andConditions.push({
              OR: adminSearchableFields.map((field) => ({
                  [field]: {
                      contains: searchTerm,
                      mode: "insensitive"
                  }
              }))
          })
      }
 // FILTERING
      if (Object.keys(filterData).length > 0) {
          const filterConditions = Object.keys(filterData).map((key) => ({
              [key]: {
                  equals: (filterData as any)[key]
              }
          }))
  
          andConditions.push(...filterConditions)
      }


   const whereConditions: Prisma.AdminWhereInput = andConditions.length > 0 ? {
        AND: andConditions
    } : {}

      // ✅ ORDER BY (default: isDeleted first)
  const orderBy: Prisma.AdminOrderByWithRelationInput[] = [
    { isDeleted: "asc" }, // false first
  ];

  if (sortBy && sortOrder) {
    orderBy.push({
      [sortBy]: sortOrder,
    } as Prisma.AdminOrderByWithRelationInput);
  }

    const result = await prisma.admin.findMany({
        skip,
        take: limit,

        where: whereConditions,
        orderBy 
    });

    const total = await prisma.admin.count({
        where: whereConditions
    });
    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
}


const deleteAdminFromDB = async (id: string) => {
    return await prisma.admin.update({
        where: {
            id
        },
        data: {
            isDeleted: true
        }
    })

}

const updateAdminById = async (id: string, payload : Partial<Admin>) => {
    return await prisma.admin.update({
        where: {
            id
        },
        data:  payload
    })
}

export const AdminService = {
    getAllAdmin,
    updateAdminById,
    deleteAdminFromDB,
}