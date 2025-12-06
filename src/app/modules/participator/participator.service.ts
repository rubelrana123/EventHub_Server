import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";

import { participatorSearchableFields } from "./participator.constant";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { IJWTPayload } from "../../types";

/**

* Get all participators with search, filter, pagination
* Includes: reviews + all joined event history
  */
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
  const allowedFields = [
  "name",
  "profilePhoto",
  "address",
  "interests",
  "bio",
  ];

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

export const ParticipatorService = {
getAllParticipator,
updateIntoDB,
deleteParticipatorFromDB,
};
