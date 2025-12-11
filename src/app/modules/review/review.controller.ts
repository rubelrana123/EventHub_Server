import { Request, Response } from "express";
import httpStatus from "http-status";
 
import { ReviewService } from "./review.service";
import catchAsync from "../../shared/catchAsync";
import { IJWTPayload } from "../../types";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";
import { reviewFilterableFields } from "./review.contant";

// ==============================
// CREATE REVIEW
// ==============================
const insertIntoDB = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
 
    const result = await ReviewService.insertIntoDB(req.user as IJWTPayload, req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review created successfully",
      data: result,
    });
  }
);

// ==============================
// GET ALL REVIEWS (with filters)
// ==============================
const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, reviewFilterableFields);
  const paginationOptions = pick(req.query, [
    "limit",
    "page",
    "sortBy",
    "sortOrder",
  ]);

  const result = await ReviewService.getAllFromDB(filters, paginationOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const ReviewController = {
  insertIntoDB,
  getAllFromDB,
};
