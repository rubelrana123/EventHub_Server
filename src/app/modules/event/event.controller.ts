import httpStatus from "http-status";
 
import { EventService } from "./event.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";
import { eventFilterableFields } from "./event.constant";

// ============================
// CREATE EVENT
// ============================
const createEvent = catchAsync(async (req, res) => {
 
 console.log(req, "req event creator");
  const result = await EventService.createEvent(req as any);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Event created successfully",
    data: result,
  });
});

// ============================
// GET ALL EVENTS
// ============================
const getAllEvents = catchAsync(async (req, res) => {
  const filters = pick(req.query, eventFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await EventService.getAllEvents(filters, options);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Events retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});


// ============================
// GET EVENT BY ID
// ============================
const getSingleEvent = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await EventService.getEventById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Event retrieved successfully",
    data: result,
  });
});

// ============================
// UPDATE EVENT
// ============================
const updateEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;
  const payload = req.body;

  const result = await EventService.updateEvent(id, user, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Event updated successfully",
    data: result,
  });
});

// ============================
// DELETE EVENT (SOFT DELETE)
// ============================
const deleteEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  const result = await EventService.deleteEvent(id, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Event deleted successfully",
    data: result,
  });
});

// ============================
// JOIN EVENT
// ============================
// const joinEvent = catchAsync(async (req, res) => {
//   const { eventId } = req.params;
//   const user = (req as any).user;

//   const result = await EventService.joinEvent(eventId, user);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.OK,
//     message: "Event joined successfully",
//     data: result,
//   });
// });
const joinEvent = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const result = await  EventService.joinEvent(
    eventId,
   ( req as any).user  
  )
  sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Event joined successfully",
      data: result,
  });
});

// ============================
// EXPORT CONTROLLER
// ============================
export const EventController = {
  createEvent,
  getAllEvents,
  getSingleEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
};
