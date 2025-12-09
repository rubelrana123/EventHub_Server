import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";
import { HostApplicationService } from "./hostApplication.service";

// ===============================
// CREATE APPLICATION (Participator)
// ===============================
const applyForHost = catchAsync(async (req: Request, res: Response) => {
  const {  message } = req.body;
   const user =(  req as any).user;
  console.log(user,"user from controller", message);

  const result = await HostApplicationService.applyForHost(
   user,
    message
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Host application submitted successfully.",
    data: result,
  });
});

// ===============================
// ADMIN → PROCESS APPLICATION (APPROVE/REJECT)
// ===============================
const processHostApplication = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // applicationId
  const { action, adminNote } = req.body;
 const adminEmail = (req as any).user?.email;
  const result = await HostApplicationService.processHostApplication(
    id,
    action,
    adminEmail,
    adminNote
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Host application ${action.toLowerCase()} successfully.`,
    data: result,
  });
});

// ===============================
// ADMIN → GET ALL APPLICATIONS
// ===============================
const getAllHostApplications = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["status", "userId"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await HostApplicationService.getAllHostApplications(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Host applications retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});

// ===============================
// USER → GET THEIR APPLICATIONS
// ===============================
const getUserHostApplications = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await HostApplicationService.getUserHostApplications(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User host applications retrieved successfully.",
    data: result,
  });
});

// ===============================
// ADMIN → GET SINGLE APPLICATION
// ===============================
const getHostApplicationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await HostApplicationService.getHostApplicationById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Host application retrieved successfully.",
    data: result,
  });
});


const deleteHostApplication = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HostApplicationService.deleteHostApplication(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Host application deleted successfully',
        data: result,
    });
});
export const HostApplicationController = {
  applyForHost,
  processHostApplication,
  getAllHostApplications,
  getUserHostApplications,
  getHostApplicationById,
  deleteHostApplication,
 
};
