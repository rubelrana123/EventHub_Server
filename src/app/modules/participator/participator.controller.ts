import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
 
import { ParticipatorService } from "./participator.service";
import { participatorFilterableFields } from "./participator.constant";
import pick from "../../helper/pick";
import { IJWTPayload } from "../../types";
 
 
 
const getAllParticipator = catchAsync(async (req: Request, res: Response) => {
 const filters = pick(req.query, participatorFilterableFields) // searching , filtering
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]) // pagination and sorting

    const result = await ParticipatorService.getAllParticipator(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Participators fetched successfully!",
        data: result
    })
});

const updateIntoDB = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await ParticipatorService.updateIntoDB(user as IJWTPayload, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Participator updated successfully',
        data: result,
    });
});

const deleteParticipatorFromDB = catchAsync(async (req: Request, res: Response) => {
    const result = await ParticipatorService.deleteParticipatorFromDB(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Participator deleted successfully!",
        data: result
    })
})

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {

  const { id } = req.params;
  const result = await ParticipatorService.getByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Participator retrieval successfully',
    data: result,
  });
});
export const ParticipatorController = {
    getAllParticipator,
    updateIntoDB,
    deleteParticipatorFromDB,
    getByIdFromDB
  
};