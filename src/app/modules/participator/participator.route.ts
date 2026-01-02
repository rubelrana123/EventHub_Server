 import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { ParticipatorController } from "./participator.controller";
 

const router = express.Router();
 
 // Participator Routes
router.get(
    "/",
    auth(UserRole.ADMIN),
    ParticipatorController.getAllParticipator
)
 
router.get(
    '/:id',
    ParticipatorController.getByIdFromDB
);

router.patch(
    "/",
    auth(UserRole.PARTICIPATOR),
    ParticipatorController.updateIntoDB
)

router.delete(
    "/:id",
    auth(UserRole.ADMIN),
    ParticipatorController.deleteParticipatorFromDB
)

router.post(
  "/join/:eventId",
  auth(UserRole.PARTICIPATOR, UserRole.HOST, UserRole.ADMIN),
  ParticipatorController.createParticipation
);

export const ParticipatorRoutes = router;