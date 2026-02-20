import express, { NextFunction, Request, Response } from "express";

import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

import { EventController } from "./event.controller";
import { fileUploader } from "../../helper/fileUploader";
import { EventValidation } from "./event.validation";

const router = express.Router();

router.post(
  "/create-event",
  auth(UserRole.HOST),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = EventValidation.create.parse(JSON.parse(req.body.data));
    return EventController.createEvent(req, res, next);
  }
);
//publick get all events
router.get(
  "/",
  EventController.getAllEvents
);

router.get("/:id", EventController.getSingleEvent);

router.patch(
  "/:id",
  auth(UserRole.HOST),
  EventController.updateEvent
);

router.patch("/soft/:id", auth(UserRole.ADMIN), EventController.deleteEvent);

//booked event by participator
router.post(
  "/:eventId/join",
  auth(UserRole.PARTICIPATOR),
  EventController.joinEvent
);
export const EventRoutes = router;
