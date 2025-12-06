import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
 
import pick from "../../helpers/pick";
import { adminFilterableFields } from "./admin.constant";
import { AdminService } from "./admin.service";
 
 
const getAllAdmin = catchAsync(async (req: Request, res: Response) => {
 const filters = pick(req.query, adminFilterableFields) // searching , filtering
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]) // pagination and sorting

    const result = await AdminService.getAllAdmin(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Admins fetched successfully!",
        data: result
    })
});

const updateAdminById = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.updateAdminById(req.params.id, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Admin update successfully!",
        data: "result"
    })
})

const deleteAdminFromDB = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.deleteAdminFromDB(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Admin deleted successfully!",
        data: result
    })
})
export const AdminController = {
    getAllAdmin,
    updateAdminById,
    deleteAdminFromDB,
  
};